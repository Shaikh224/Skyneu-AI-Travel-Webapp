import React, { useState, useEffect } from 'react';
import { Brain, X, AlertCircle, Info, DollarSign, MapPin, Clock, Zap, Star, Luggage, Smile, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { useFlightInsightsCache } from '../contexts/FlightInsightsCacheContext';

// Minimal InsightData type for type safety
interface InsightData {
  summary?: string;
  priceAnalysis?: any;
  priceBreakdown?: any;
  bestTimeToBook?: any;
  airports?: {
    departure?: any;
    arrival?: any;
  };
  layoverInsights?: any;
  airlineAmenities?: any;
  otherFeatures?: any;
  travelTips?: any;
  smartInsights?: any;
  historicalPricing?: any;
  tripScore?: any;
  flightDetails?: any;
  flexibleSearch?: any;
  llmQA?: any;
  routeOptimization?: any;
  carbonFootprint?: any;
}

// Helper: Badge for data quality
const DataBadge = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
    {ok ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
    {label}
  </span>
);

// Helper: Collapsible section
const Collapsible: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button className="flex items-center w-full text-left font-semibold text-gray-900 dark:text-white py-2" onClick={() => setOpen(o => !o)}>
        {open ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
        {title}
      </button>
      {open && <div className="pl-6 pb-2">{children}</div>}
    </div>
  );
};

// Helper: Section title
const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <Icon className="w-5 h-5 mr-2" />
    {children}
  </h3>
);

// Helper: List
const DataList = ({ items }: { items: string[] }) => (
  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
    {items && items.length > 0 ? items.map((item, i) => <li key={i}>{item}</li>) : <li className="italic text-gray-400">No data</li>}
  </ul>
);

// Helper: Format date/time
const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString || dateTimeString === 'TBD' || dateTimeString === 'Data not available') {
    return dateTimeString;
  }
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return dateTimeString; // Return original if invalid date
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateTimeString; // Return original if parsing fails
  }
};

// Helper: Table for key-value
const DataTable = ({ data }: { data: Record<string, any> }) => {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not available';
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None available';
    }
    if (typeof value === 'object') {
      // Convert object to readable format instead of JSON.stringify
      const entries = Object.entries(value);
      if (entries.length === 0) return 'No details available';
      return entries.map(([key, val]) => `${key}: ${val}`).join('; ');
    }
    return String(value);
  };

  return (
    <table className="w-full text-sm">
      <tbody>
        {Object.entries(data).map(([k, v]) => (
          <tr key={k}>
            <td className="pr-2 font-medium text-gray-600 dark:text-gray-400 align-top capitalize">
              {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
            </td>
            <td className="text-gray-900 dark:text-white">{formatValue(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Data quality banner
const DataQualityBanner = ({ insights }: { insights: any }) => {
  // Check for real data vs fallback data
  const isRealData = (value: any, fallbackIndicators: string[] = ['pending', 'unavailable', 'unknown', 'not itemized', 'check', 'Data not available', 'NO REAL DATA FOUND']) => {
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    if (typeof value === 'string') {
      return !fallbackIndicators.some(indicator => value.toLowerCase().includes(indicator.toLowerCase()));
    }
    return true;
  };

  const realDataFields = [
    isRealData(insights.summary),
    isRealData(insights.priceAnalysis?.recommendation),
    isRealData(insights.airports?.departure?.name),
    isRealData(insights.airports?.arrival?.name),
    isRealData(insights.layoverInsights?.activities),
    isRealData(insights.airlineAmenities?.meals),
    isRealData(insights.otherFeatures?.baggage?.policies),
    isRealData(insights.travelTips?.beforeDeparture),
    isRealData(insights.routeOptimization?.efficiency),
    isRealData(insights.carbonFootprint?.totalEmissions)
  ];

  const realDataCount = realDataFields.filter(Boolean).length;
  const totalFields = realDataFields.length;
  const realDataPercentage = (realDataCount / totalFields) * 100;

  if (realDataPercentage >= 60) return null; // Good data quality, no banner needed

  return (
    <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
      <strong>Data Quality Notice:</strong> Only {realDataCount}/{totalFields} fields contain real data ({Math.round(realDataPercentage)}%). Some information may be incomplete or fallback data. Try refreshing for more complete results.
    </div>
  );
};

const tabList = [
  { key: 'overview', label: 'Overview', icon: Info },
  { key: 'price', label: 'Price', icon: DollarSign },
  { key: 'airports', label: 'Airports', icon: MapPin },
  { key: 'layovers', label: 'Layovers', icon: Clock },
  { key: 'smart', label: 'Smart', icon: Zap },
  { key: 'other', label: 'Other', icon: Star }
];

type TabKey = 'overview' | 'price' | 'airports' | 'layovers' | 'smart' | 'other';

const AIInsights: React.FC<any> = ({ isOpen, onClose, flightData, currency = 'USD' }) => {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get flight insights cache
  const { getFlightCache, setAIInsights, hasCachedAIInsights } = useFlightInsightsCache();
  
  // Generate unique flight ID
  const getFlightId = (flight: any): string => {
    if (flight?.id) return flight.id;
    const segment = flight?.itineraries?.[0]?.segments?.[0];
    if (segment) {
      return `${segment.carrierCode}${segment.number}-${segment.departure?.iataCode}-${segment.arrival?.iataCode}`;
    }
    return `flight-${Date.now()}`;
  };

  // Cache for API responses to avoid redundant calls
  const apiCache: { [key: string]: any } = {};

  // Parse JSON from potentially malformed text
  const parseJsonFromText = (content: string): { success: boolean; data?: any; error?: string } => {
    // console.log('🔍 Parsing JSON content (length:', content.length, ')');
    
    // Strategy 1: Direct JSON parsing
    try {
      const result = JSON.parse(content);
      // console.log('✅ Direct JSON parsing successful');
      return { success: true, data: result };
    } catch (e) {
      // console.log('❌ Direct JSON parsing failed, trying cleanup strategies...');
    }

    // Strategy 2: Find and extract complete JSON object with advanced repairs
    try {
      // Remove markdown code blocks and extra text
      let cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*$/gi, '')
        .replace(/^.*?(?=\{)/s, '') // Remove everything before first {
        .trim();

      // Find the complete JSON object by counting braces
      let braceCount = 0;
      let jsonEnd = -1;
      let jsonStart = cleaned.indexOf('{');
      
      if (jsonStart === -1) {
        throw new Error('No opening brace found');
      }

      for (let i = jsonStart; i < cleaned.length; i++) {
        if (cleaned[i] === '{') {
          braceCount++;
        } else if (cleaned[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
      }

      if (jsonEnd === -1) {
        throw new Error('No matching closing brace found');
      }

      let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
      // console.log('🔧 Extracted JSON string (length:', jsonStr.length, ')');
      
      // Apply comprehensive JSON fixes
      jsonStr = jsonStr
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*'([^'\\]*(\\.[^'\\]*)*)'/g, ':"$1"') // Convert single quotes to double
        .replace(/:\s*True\b/gi, ': true') // Fix boolean values
        .replace(/:\s*False\b/gi, ': false')
        .replace(/:\s*None\b/gi, ': null')
        .replace(/:\s*undefined\b/gi, ': null')
        .replace(/:\s*NaN\b/gi, ': null')
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas again
        .replace(/([}\]])(\s*)([{"\[])/g, '$1,$2$3') // Add missing commas between objects/arrays
        .replace(/([^,\s{}\[\]":])(\s*)("[\w]+":)/g, '$1,$2$3') // Add missing commas before properties
        .replace(/("\w+":\s*"[^"]*")(\s*)("[\w]+":)/g, '$1,$2$3'); // Add missing commas between string properties

      const result = JSON.parse(jsonStr);
      // console.log('✅ JSON cleanup and parsing successful');
      return { success: true, data: result };
    } catch (e) {
      // console.log('❌ JSON cleanup parsing failed:', e);
    }

    // Strategy 3: Advanced JSON repair with line-by-line analysis
    try {
      let fixed = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*$/gi, '')
        .replace(/^[^{]*/, '') // Remove everything before first {
        .replace(/}[^}]*$/, '}'); // Keep only until last }

      // Split into lines and repair each line
      const lines = fixed.split('\n');
      const repairedLines = lines.map((line, index) => {
        let repairedLine = line.trim();
        
        // Skip empty lines and braces
        if (!repairedLine || repairedLine === '{' || repairedLine === '}') {
          return repairedLine;
        }
        
        // Fix missing quotes around keys
        repairedLine = repairedLine.replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/, '$1"$2":');
        
        // Fix single quotes to double quotes
        repairedLine = repairedLine.replace(/:\s*'([^'\\]*(\\.[^'\\]*)*)'/g, ':"$1"');
        
        // Fix boolean values
        repairedLine = repairedLine.replace(/:\s*True\b/gi, ': true');
        repairedLine = repairedLine.replace(/:\s*False\b/gi, ': false');
        repairedLine = repairedLine.replace(/:\s*None\b/gi, ': null');
        repairedLine = repairedLine.replace(/:\s*undefined\b/gi, ': null');
        
        // Add missing comma at end if this line contains a property and next line isn't a closing brace
        const nextLine = lines[index + 1]?.trim();
        if (repairedLine.includes(':') && 
            !repairedLine.endsWith(',') && 
            !repairedLine.endsWith('{') && 
            !repairedLine.endsWith('[') &&
            nextLine && 
            nextLine !== '}' && 
            nextLine !== ']' && 
            !nextLine.startsWith('}') && 
            !nextLine.startsWith(']')) {
          repairedLine += ',';
        }
        
        // Remove trailing comma if next line is closing brace
        if (repairedLine.endsWith(',') && 
            (nextLine === '}' || nextLine === ']' || nextLine?.startsWith('}') || nextLine?.startsWith(']'))) {
          repairedLine = repairedLine.slice(0, -1);
        }
        
        return repairedLine;
      });
      
      fixed = repairedLines.join('\n');
      
      // Final cleanup
      fixed = fixed
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'); // Quote keys again

      const result = JSON.parse(fixed);
      // console.log('✅ Advanced JSON repair successful');
      return { success: true, data: result };
    } catch (e) {
      // console.log('❌ Advanced JSON repair failed:', e);
    }

    // Strategy 4: Truncate at error position and retry
    try {
      // If we got a position error, try truncating at that position
      const errorMatch = content.match(/at position (\d+)/);
      if (errorMatch) {
        const position = parseInt(errorMatch[1]);
        // console.log('🔧 Truncating at error position:', position);
        
        let truncated = content.substring(0, position);
        
        // Find the last complete property before the error
        const lastComma = truncated.lastIndexOf(',');
        const lastOpenBrace = truncated.lastIndexOf('{');
        const lastOpenBracket = truncated.lastIndexOf('[');
        
        if (lastComma > Math.max(lastOpenBrace, lastOpenBracket)) {
          truncated = truncated.substring(0, lastComma);
        }
        
        // Close any open structures
        let openBraces = (truncated.match(/\{/g) || []).length - (truncated.match(/\}/g) || []).length;
        let openBrackets = (truncated.match(/\[/g) || []).length - (truncated.match(/\]/g) || []).length;
        
        while (openBrackets > 0) {
          truncated += ']';
          openBrackets--;
        }
        while (openBraces > 0) {
          truncated += '}';
          openBraces--;
        }
        
        const result = JSON.parse(truncated);
        // console.log('✅ Truncation strategy successful');
        return { success: true, data: result };
      }
    } catch (e) {
      // console.log('❌ Truncation strategy failed:', e);
    }

    // Strategy 5: Try to complete incomplete JSON structure
    try {
      let fixed = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*$/gi, '')
        .replace(/^[^{]*/, ''); // Remove everything before first {

      // Check if JSON is incomplete and try to complete it
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;

      // Remove any trailing incomplete property
      const lines = fixed.split('\n');
      const cleanLines = [];
      let lastCompleteLineIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          cleanLines.push(line);
          continue;
        }

        // Check if this line looks like a complete property
        if (line.includes(':') && (line.endsWith(',') || line.endsWith('"') || line.endsWith('}') || line.endsWith(']') || line.endsWith('true') || line.endsWith('false') || line.endsWith('null'))) {
          lastCompleteLineIndex = cleanLines.length;
        }
        
        cleanLines.push(line);
      }

      // Keep only up to the last complete line
      if (lastCompleteLineIndex >= 0) {
        fixed = cleanLines.slice(0, lastCompleteLineIndex + 1).join('\n');
      }

      // Add missing closing braces/brackets
      let missingCloseBraces = openBraces - closeBraces;
      let missingCloseBrackets = openBrackets - closeBrackets;

      while (missingCloseBrackets > 0) {
        fixed += '\n]';
        missingCloseBrackets--;
      }
      while (missingCloseBraces > 0) {
        fixed += '\n}';
        missingCloseBraces--;
      }

      // Final cleanup
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

      const result = JSON.parse(fixed);
      // console.log('✅ JSON completion strategy successful');
      return { success: true, data: result };
    } catch (e) {
      // console.log('❌ JSON completion strategy failed:', e);
    }

    return { 
      success: false, 
      error: `JSON parsing failed after all strategies. Content preview: "${content.substring(0, 100)}..."`
    };
  };

  // Enhanced Sonar Pro API calling with ultra-robust error handling
  const callSonarProAPI = async (cacheKey: string, prompt: string, maxTokens: number = 1200, retryCount: number = 0): Promise<any> => {
    // Check cache first
    if (cacheKey in apiCache) {
      // console.log('Using cached result for:', cacheKey);
      return apiCache[cacheKey];
    }

    const apiKey = import.meta.env.VITE_SONAR_API_KEY;
    if (!apiKey) {
      console.error('Sonar API key not found');
      return {
        error: 'API key missing',
        details: 'Please add VITE_SONAR_API_KEY to your environment variables'
      };
    }

    const maxRetries = 3;

    try {
      // console.log(`🔄 [Attempt ${retryCount + 1}/${maxRetries + 1}] Calling Sonar Pro API with prompt (${prompt.length} chars)`);

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: "You are a real-time flight analysis AI. Provide accurate, current data from official sources. Return only valid JSON in the exact format requested."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (${response.status}):`, errorText);
        
        if (retryCount < maxRetries) {
          // console.log(`🔄 Retrying in ${(retryCount + 1) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return callSonarProAPI(cacheKey, prompt, maxTokens, retryCount + 1);
        }
        
        return {
          error: `API request failed with status ${response.status}`,
          details: errorText,
          retryCount
        };
      }

      const data = await response.json();
      // console.log('✅ Raw API Response received:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error('❌ Invalid API response structure:', data);
        
        if (retryCount < maxRetries) {
          // console.log(`🔄 Retrying due to invalid response structure...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return callSonarProAPI(cacheKey, prompt, maxTokens, retryCount + 1);
        }
        
        return {
          error: 'Invalid API response structure',
          details: 'Response missing expected fields',
          rawResponse: data
        };
      }

      const content = data.choices[0].message.content.trim();
      // console.log('📄 API Response Content:', content.substring(0, 200) + '...');

      // Parse the JSON response
      const parseResult = parseJsonFromText(content);
      
      if (!parseResult.success) {
        console.error('❌ JSON parsing failed:', parseResult.error);
        console.error('📄 Raw content causing issues:', content.substring(11900, 12100)); // Show content around error position
        
        if (retryCount < maxRetries) {
          // console.log(`🔄 Retrying due to JSON parsing failure...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return callSonarProAPI(cacheKey, prompt, maxTokens, retryCount + 1);
        }
        
        return {
          error: 'JSON parsing failed',
          details: parseResult.error,
          rawContent: content
        };
      }

      // Cache successful result
      apiCache[cacheKey] = parseResult.data;
      // console.log('✅ Successfully parsed and cached API response');
      
      return parseResult.data;

    } catch (err) {
      console.error('❌ Network/fetch error:', err);
      
      if (retryCount < maxRetries) {
        // console.log(`🔄 Retrying due to network error in ${(retryCount + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return callSonarProAPI(cacheKey, prompt, maxTokens, retryCount + 1);
      }
      
      return {
        error: 'Network error',
        details: err instanceof Error ? err.message : 'Unknown network error',
        retryCount
      };
    }
  };

  // Comprehensive flight insights function
  const getComprehensiveFlightInsights = async (flightData: any, route: any) => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `insights_${route.from}_${route.to}_${today}`;

    const prompt = `
You are a real-time flight analysis AI. Analyze the flight from ${route.from} to ${route.to} departing ${route.departure}.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON in the exact format specified below
2. Use real, current data from web searches for ALL fields
3. DO NOT use placeholders like "pending", "unavailable", "check with airline", etc.
4. If real data cannot be found, use "Data not available" but still fill the field
5. Search for actual airport information for both ${route.from} and ${route.to}
6. Find real airline amenities and baggage policies
7. Include comprehensive travel tips for this specific route
8. MUST include real website URLs for airports and airlines
9. Include actual sources where data was found
10. Calculate or estimate carbon footprint based on aircraft type and distance
11. Provide visa requirements for layover countries (if applicable)
12. Analyze route efficiency and provide optimization suggestions
13. Get detailed airport information including lounges, dining, shopping, services, and parking
14. Search for specific lounge names, restaurant brands, and shop names at each airport
15. Include current parking rates and shuttle information
16. Find real WiFi speeds and charging station locations

Flight Details: ${JSON.stringify(flightData, null, 2)}

Return this JSON structure with REAL DATA:

{
  "summary": "Comprehensive analysis of ${route.from} to ${route.to} flight with current market data",
  "priceAnalysis": {
    "score": 8,
    "recommendation": "Current market assessment based on real data",
    "confidence": 85,
    "historicalTrend": "stable/trending up/trending down",
    "vsAirlineAverage": "above/below/similar to airline average",
    "vsRouteAverage": "above/below/similar to route average",
    "isDeal": true,
    "prediction": "Real price prediction for next 30 days"
  },
  "airports": {
    "departure": {
      "name": "Full name of ${route.from} airport",
      "amenities": ["Real amenities from ${route.from} airport"],
      "tips": ["Current tips for ${route.from}"],
      "facilities": ["Available facilities"],
      "transportation": {"Method": "Details and cost"},
      "website": "https://www.real-airport-website.com",
      "sources": ["Official ${route.from} airport website", "Port authority data"],
      "security": {
        "avgWaitTime": "Current wait times",
        "peakHours": ["Busy hours"],
        "tips": ["Security tips"]
      },
      "lounges": {
        "airlineSpecific": ["Airline-specific lounges available"],
        "independent": ["Independent lounges like Priority Pass"],
        "amenities": ["Lounge amenities available"],
        "accessRequirements": ["Access requirements and fees"]
      },
      "dining": {
        "restaurants": ["Full-service restaurants"],
        "fastFood": ["Quick dining options"],
        "cafes": ["Coffee shops and cafes"],
        "bars": ["Bars and lounges"],
        "specialDietary": ["Vegetarian, halal, kosher options"]
      },
      "shopping": {
        "dutyfree": ["Duty-free shopping options"],
        "retail": ["Retail stores and boutiques"],
        "souvenirs": ["Souvenir and gift shops"],
        "electronics": ["Electronics and tech stores"],
        "books": ["Bookstores and newsstands"]
      },
      "services": {
        "wifi": "Free WiFi availability and speed",
        "charging": ["Charging stations and power outlets"],
        "baggage": ["Baggage storage and wrapping services"],
        "medical": ["Medical facilities and pharmacy"],
        "banking": ["ATMs, currency exchange, banking"],
        "businessServices": ["Business center, meeting rooms, printing"]
      },
      "parking": {
        "shortTerm": "Short-term parking rates and availability",
        "longTerm": "Long-term parking options and costs",
        "valet": "Valet parking services",
        "reservations": "Online reservation options",
        "shuttles": "Shuttle services from parking areas"
      }
    },
    "arrival": {
      "name": "Full name of ${route.to} airport",
      "amenities": ["Real amenities from ${route.to} airport"],
      "tips": ["Current tips for ${route.to}"],
      "facilities": ["Available facilities"],
      "transportation": {"Method": "Details and cost"},
      "website": "https://www.real-airport-website.com",
      "sources": ["Official ${route.to} airport website", "Airport authority data"],
      "security": {
        "avgWaitTime": "Current wait times",
        "peakHours": ["Busy hours"],
        "tips": ["Security tips"]
      },
      "lounges": {
        "airlineSpecific": ["Airline-specific lounges available"],
        "independent": ["Independent lounges like Priority Pass"],
        "amenities": ["Lounge amenities available"],
        "accessRequirements": ["Access requirements and fees"]
      },
      "dining": {
        "restaurants": ["Full-service restaurants"],
        "fastFood": ["Quick dining options"],
        "cafes": ["Coffee shops and cafes"],
        "bars": ["Bars and lounges"],
        "specialDietary": ["Vegetarian, halal, kosher options"]
      },
      "shopping": {
        "dutyfree": ["Duty-free shopping options"],
        "retail": ["Retail stores and boutiques"],
        "souvenirs": ["Souvenir and gift shops"],
        "electronics": ["Electronics and tech stores"],
        "books": ["Bookstores and newsstands"]
      },
      "services": {
        "wifi": "Free WiFi availability and speed",
        "charging": ["Charging stations and power outlets"],
        "baggage": ["Baggage storage and wrapping services"],
        "medical": ["Medical facilities and pharmacy"],
        "banking": ["ATMs, currency exchange, banking"],
        "businessServices": ["Business center, meeting rooms, printing"]
      },
      "parking": {
        "shortTerm": "Short-term parking rates and availability",
        "longTerm": "Long-term parking options and costs",
        "valet": "Valet parking services",
        "reservations": "Online reservation options",
        "shuttles": "Shuttle services from parking areas"
      }
    }
  },
  "layoverInsights": {
    "duration": "Layover duration or 'Direct flight'",
    "airport": "Layover airport code or 'Direct flight'",
    "activities": ["Things to do if layover"],
    "facilities": ["Layover airport facilities"],
    "tips": ["Layover tips"],
    "visaInfo": {
      "required": false,
      "transitVisa": "Not required for layover",
      "requirements": ["Passport valid for 6+ months"],
      "processingTime": "N/A for transit",
      "notes": ["Stay in international transit area"]
    }
  },
  "airlineAmenities": {
    "meals": ["Meal options available"],
    "entertainment": ["Entertainment options"],
    "wifi": "WiFi availability and pricing",
    "powerOutlets": "Power outlet availability",
    "amenityKits": ["Amenity kit contents"],
    "loungeAccess": "Lounge access details",
    "seatComfort": "Seat comfort details",
    "serviceRating": "Service rating from reviews"
  },
  "otherFeatures": {
    "baggage": {
      "policies": ["Current baggage policies"],
      "fees": ["Baggage fee structure"],
      "tips": ["Packing tips"],
      "restrictions": ["Baggage restrictions"],
      "oversized": ["Oversized baggage policies"]
    }
  },
  "travelTips": {
    "beforeDeparture": ["Tips before leaving for airport"],
    "atAirport": ["Tips at departure airport"],
    "duringFlight": ["In-flight tips"],
    "atDestination": ["Tips upon arrival"],
    "cultural": ["Cultural tips for ${route.to}"],
    "weather": ["Weather advice"],
    "currency": ["Currency tips"],
    "emergency": ["Emergency contacts with phone numbers"]
  },
  "smartInsights": {
    "onTimePerformance": {
      "route": "XX% on-time for this route",
      "airline": "XX% for this airline"
    },
    "delayRisk": {
      "minor": "XX% chance minor delays",
      "major": "XX% chance major delays"
    }
  },
  "tripScore": {
    "overall": 8,
    "breakdown": {
      "value": 8,
      "convenience": 7,
      "comfort": 8,
      "reliability": 8
    },
    "reasoning": ["Reasons for scores"]
  },
  "flightDetails": {
    "duration": "flight duration",
    "stops": 0,
    "airline": "airline code",
    "airlineName": "full airline name",
    "airlineWebsite": "https://www.real-airline-website.com",
    "flightNumber": "flight number",
    "aircraft": "aircraft type",
    "departureTime": "2025-07-03T10:30:00Z",
    "arrivalTime": "2025-07-03T18:45:00Z"
  },
  "routeOptimization": {
    "efficiency": "85%",
    "alternativeRoutes": ["Route via hub X", "Direct alternative"],
    "timeVsPrice": "Current route balances time and cost effectively",
    "bestDealTimes": ["Tuesday-Thursday departures save 15%"],
    "seasonalTrends": ["Summer prices 20% higher than current"]
  },
  "carbonFootprint": {
    "totalEmissions": "1.2 tons CO2",
    "perPassenger": "0.24 tons CO2 per passenger",
    "comparison": "15% lower than average for this route",
    "offsetCost": "$12-18 to offset emissions",
    "ecoTips": ["Choose economy class", "Pack light", "Consider direct flights"],
    "airlineEfficiency": "Modern aircraft with 20% better fuel efficiency"
  }
}

IMPORTANT: Include real website URLs for airports and airlines. Search for current information about ${route.from} and ${route.to} airports, airline amenities, baggage policies, and travel conditions. Return only the JSON above with real data and working links.`;

    return await callSonarProAPI(cacheKey, prompt, 4000); // Increased token limit to reduce truncation
  };

  // Validate and normalize API data
  const validateAndNormalizeApiData = (data: any, rawFlightData?: any) => {
    if (!data || typeof data !== 'object') {
      console.warn('❌ Data validation failed: Invalid data type');
      return null;
    }

    // console.log('✅ Processing Perplexity API data:', data);
    
    // Extract aircraft info from raw flight data
    const aircraftType = rawFlightData?.aircraft?.type || 
                        rawFlightData?.itineraries?.[0]?.segments?.[0]?.aircraft?.code || 
                        data.flightDetails?.aircraft || 
                        'Data not available';

    // Merge API data with minimal defaults only where data is missing
    const normalized = {
      summary: data.summary || 'Flight analysis completed',
      priceAnalysis: data.priceAnalysis || {
        score: 5,
        recommendation: 'Price analysis unavailable',
        confidence: 50,
        historicalTrend: 'stable',
        vsAirlineAverage: 'unavailable',
        vsRouteAverage: 'unavailable',
        isDeal: false,
        prediction: 'stable'
      },
      airports: data.airports || {
        departure: {
          name: 'Departure airport info pending',
          amenities: [],
          tips: [],
          facilities: [],
          transportation: {},
          website: '',
          sources: [],
          security: { avgWaitTime: 'Variable', peakHours: [], tips: [] },
          lounges: {
            airlineSpecific: [],
            independent: [],
            amenities: [],
            accessRequirements: []
          },
          dining: {
            restaurants: [],
            fastFood: [],
            cafes: [],
            bars: [],
            specialDietary: []
          },
          shopping: {
            dutyfree: [],
            retail: [],
            souvenirs: [],
            electronics: [],
            books: []
          },
          services: {
            wifi: 'Check airport for WiFi details',
            charging: [],
            baggage: [],
            medical: [],
            banking: [],
            businessServices: []
          },
          parking: {
            shortTerm: 'Check airport for parking rates',
            longTerm: 'Check airport for long-term options',
            valet: 'Check availability',
            reservations: 'Check online booking',
            shuttles: 'Check shuttle services'
          }
        },
        arrival: {
          name: 'Arrival airport info pending',
          amenities: [],
          tips: [],
          facilities: [],
          transportation: {},
          website: '',
          sources: [],
          security: { avgWaitTime: 'Variable', peakHours: [], tips: [] },
          lounges: {
            airlineSpecific: [],
            independent: [],
            amenities: [],
            accessRequirements: []
          },
          dining: {
            restaurants: [],
            fastFood: [],
            cafes: [],
            bars: [],
            specialDietary: []
          },
          shopping: {
            dutyfree: [],
            retail: [],
            souvenirs: [],
            electronics: [],
            books: []
          },
          services: {
            wifi: 'Check airport for WiFi details',
            charging: [],
            baggage: [],
            medical: [],
            banking: [],
            businessServices: []
          },
          parking: {
            shortTerm: 'Check airport for parking rates',
            longTerm: 'Check airport for long-term options',
            valet: 'Check availability',
            reservations: 'Check online booking',
            shuttles: 'Check shuttle services'
          }
        }
      },
      layoverInsights: data.layoverInsights || {
        duration: 'No layover',
        airport: 'Direct flight',
        activities: [],
        facilities: [],
        tips: [],
        visaInfo: {
          required: false,
          transitVisa: 'Not required for direct flight',
          requirements: [],
          processingTime: 'N/A',
          notes: ['Direct flight - no transit required']
        }
      },
      airlineAmenities: data.airlineAmenities || {
        meals: [],
        entertainment: [],
        wifi: 'Check with airline',
        powerOutlets: 'Check with airline',
        amenityKits: [],
        loungeAccess: 'Check eligibility',
        seatComfort: 'Standard'
      },
      otherFeatures: data.otherFeatures || {
        baggage: {
          policies: [],
          fees: [],
          tips: [],
          restrictions: []
        }
      },
      travelTips: data.travelTips || {
        beforeDeparture: [],
        atAirport: [],
        duringFlight: [],
        atDestination: [],
        cultural: [],
        weather: [],
        currency: [],
        emergency: []
      },
      smartInsights: data.smartInsights || {
        onTimePerformance: {
          route: 'Data unavailable',
          airline: 'Data unavailable'
        },
        delayRisk: {
          minor: '15%',
          major: '8%'
        }
      },
      tripScore: data.tripScore || {
        overall: 5,
        breakdown: {
          value: 5,
          convenience: 5,
          comfort: 5,
          reliability: 5
        },
        reasoning: []
      },
      flightDetails: data.flightDetails || {
        duration: rawFlightData?.itineraries?.[0]?.duration || 'Data not available',
        stops: rawFlightData?.itineraries?.[0]?.segments?.length - 1 || 0,
        airline: rawFlightData?.itineraries?.[0]?.segments?.[0]?.carrierCode || 'N/A',
        airlineName: 'Airline information pending',
        airlineWebsite: '',
        flightNumber: rawFlightData?.itineraries?.[0]?.segments?.[0]?.number || 'N/A',
        aircraft: aircraftType,
        departureTime: rawFlightData?.itineraries?.[0]?.segments?.[0]?.departure?.at || 'TBD',
        arrivalTime: rawFlightData?.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.at || 'TBD'
      },
      routeOptimization: data.routeOptimization || {
        efficiency: 'Data not available',
        alternativeRoutes: [],
        timeVsPrice: 'Analysis pending',
        bestDealTimes: [],
        seasonalTrends: []
      },
      carbonFootprint: data.carbonFootprint || {
        totalEmissions: 'Data not available',
        perPassenger: 'Data not available',
        comparison: 'Comparison unavailable',
        offsetCost: 'Calculate separately',
        ecoTips: [],
        airlineEfficiency: 'Data not available'
      }
    };

    // console.log('✅ Successfully normalized Perplexity API data:', normalized);
    return normalized;
  };

  // Main useEffect to fetch insights
  useEffect(() => {
    const fetchInsights = async () => {
      if (!isOpen || !flightData) return;
      
      // Generate flight ID for caching
      const flightId = getFlightId(flightData);
      
      // Check if we have cached data
      if (hasCachedAIInsights(flightId)) {
        console.log(`✅ Using cached AI Insights for flight ${flightId}`);
        const cachedData = getFlightCache(flightId);
        if (cachedData?.aiInsights) {
          setInsights(cachedData.aiInsights);
          setLoading(false);
          return;
        }
      }
      
      const apiKey = import.meta.env.VITE_SONAR_API_KEY;
      if (!apiKey) {
        setError('API key not configured. Please add VITE_SONAR_API_KEY to your .env file.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      setInsights(null);
      
      try {
        const route = {
          from: flightData.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || '',
          to: flightData.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || '',
          departure: flightData.itineraries?.[0]?.segments?.[0]?.departure?.at || new Date().toISOString()
        };

        const comprehensiveData = await getComprehensiveFlightInsights(flightData, route);
        
        if (!comprehensiveData || comprehensiveData.error) {
          let errorMessage = comprehensiveData?.error || 'API response invalid';
          let additionalInfo = comprehensiveData?.details || '';
          
          // Check if it's a JSON parsing error
          if (errorMessage.toLowerCase().includes('json parsing failed')) {
            // console.log('🔄 JSON parsing failed, attempting to use fallback data...');
            
            // Create reasonable fallback data based on flight info
            const fallbackData = {
              summary: `Flight analysis for ${route.from} to ${route.to} route`,
              priceAnalysis: {
                score: 6,
                recommendation: 'Price analysis temporarily unavailable - please try again later',
                confidence: 50,
                historicalTrend: 'stable',
                vsAirlineAverage: 'comparable',
                vsRouteAverage: 'comparable',
                isDeal: false,
                prediction: 'Prices expected to remain stable'
              },
              airports: {
                departure: {
                  name: `${route.from} Airport`,
                  amenities: ['Check airport website for current amenities'],
                  tips: ['Arrive 2-3 hours early for international flights'],
                  facilities: ['Standard airport facilities available'],
                  transportation: {'Public Transit': 'Available', 'Taxi/Rideshare': 'Available'},
                  website: '',
                  sources: ['Airport information pending'],
                  security: { avgWaitTime: '30-45 minutes', peakHours: ['6-9 AM', '4-7 PM'], tips: ['Remove electronics and liquids'] },
                  lounges: {
                    airlineSpecific: ['Check with your airline for lounge access'],
                    independent: ['Priority Pass lounges may be available'],
                    amenities: ['WiFi, seating, refreshments typically available'],
                    accessRequirements: ['Premium tickets, membership, or day passes']
                  },
                  dining: {
                    restaurants: ['Various dining options available'],
                    fastFood: ['Quick service restaurants'],
                    cafes: ['Coffee shops and light meals'],
                    bars: ['Bar and lounge areas'],
                    specialDietary: ['Check for dietary-specific options']
                  },
                  shopping: {
                    dutyfree: ['Duty-free shopping available for international flights'],
                    retail: ['Retail stores and boutiques'],
                    souvenirs: ['Local souvenir shops'],
                    electronics: ['Electronics and travel accessories'],
                    books: ['Bookstores and magazines']
                  },
                  services: {
                    wifi: 'Free WiFi typically available',
                    charging: ['Charging stations throughout terminal'],
                    baggage: ['Baggage services available'],
                    medical: ['Medical facilities on-site'],
                    banking: ['ATMs and currency exchange'],
                    businessServices: ['Business facilities may be available']
                  },
                  parking: {
                    shortTerm: 'Short-term parking available',
                    longTerm: 'Long-term parking options',
                    valet: 'Valet services may be available',
                    reservations: 'Online reservations recommended',
                    shuttles: 'Shuttle services to terminals'
                  }
                },
                arrival: {
                  name: `${route.to} Airport`,
                  amenities: ['Check airport website for current amenities'],
                  tips: ['Check visa requirements before travel'],
                  facilities: ['Standard airport facilities available'],
                  transportation: {'Public Transit': 'Available', 'Taxi/Rideshare': 'Available'},
                  website: '',
                  sources: ['Airport information pending'],
                  security: { avgWaitTime: '20-30 minutes', peakHours: ['6-9 AM', '4-7 PM'], tips: ['Have passport ready'] },
                  lounges: {
                    airlineSpecific: ['Check with your airline for lounge access'],
                    independent: ['Priority Pass lounges may be available'],
                    amenities: ['WiFi, seating, refreshments typically available'],
                    accessRequirements: ['Premium tickets, membership, or day passes']
                  },
                  dining: {
                    restaurants: ['Various dining options available'],
                    fastFood: ['Quick service restaurants'],
                    cafes: ['Coffee shops and light meals'],
                    bars: ['Bar and lounge areas'],
                    specialDietary: ['Check for dietary-specific options']
                  },
                  shopping: {
                    dutyfree: ['Duty-free shopping available for international flights'],
                    retail: ['Retail stores and boutiques'],
                    souvenirs: ['Local souvenir shops'],
                    electronics: ['Electronics and travel accessories'],
                    books: ['Bookstores and magazines']
                  },
                  services: {
                    wifi: 'Free WiFi typically available',
                    charging: ['Charging stations throughout terminal'],
                    baggage: ['Baggage services available'],
                    medical: ['Medical facilities on-site'],
                    banking: ['ATMs and currency exchange'],
                    businessServices: ['Business facilities may be available']
                  },
                  parking: {
                    shortTerm: 'Short-term parking available',
                    longTerm: 'Long-term parking options',
                    valet: 'Valet services may be available',
                    reservations: 'Online reservations recommended',
                    shuttles: 'Shuttle services to terminals'
                  }
                }
              },
              layoverInsights: {
                duration: 'Direct flight',
                airport: 'N/A',
                activities: [],
                facilities: [],
                tips: [],
                visaInfo: {
                  required: false,
                  transitVisa: 'Check requirements for your nationality',
                  requirements: ['Valid passport'],
                  processingTime: 'N/A',
                  notes: ['Verify visa requirements before travel']
                }
              },
              airlineAmenities: {
                meals: ['Check with airline for meal options'],
                entertainment: ['In-flight entertainment system'],
                wifi: 'Check with airline for WiFi availability',
                powerOutlets: 'Available on most modern aircraft',
                amenityKits: ['Basic amenity kit'],
                loungeAccess: 'Depends on ticket class and membership',
                seatComfort: 'Standard airline seating'
              },
              otherFeatures: {
                baggage: {
                  policies: ['Check airline website for current baggage policies'],
                  fees: ['Fees vary by airline and destination'],
                  tips: ['Pack essentials in carry-on'],
                  restrictions: ['No liquids over 100ml in carry-on']
                }
              },
              travelTips: {
                beforeDeparture: ['Check passport validity', 'Confirm flight status'],
                atAirport: ['Arrive early', 'Have documents ready'],
                duringFlight: ['Stay hydrated', 'Move around periodically'],
                atDestination: ['Check local customs', 'Have local currency'],
                cultural: ['Research local customs and etiquette'],
                weather: ['Check weather forecast for destination'],
                currency: ['Consider getting local currency'],
                emergency: ['Keep emergency contacts accessible']
              },
              smartInsights: {
                onTimePerformance: {
                  route: 'Performance data temporarily unavailable',
                  airline: 'Performance data temporarily unavailable'
                },
                delayRisk: {
                  minor: '15% estimated',
                  major: '5% estimated'
                }
              },
              tripScore: {
                overall: 7,
                breakdown: {
                  value: 7,
                  convenience: 7,
                  comfort: 7,
                  reliability: 7
                },
                reasoning: ['Fallback scoring while real data loads']
              },
              flightDetails: {
                duration: flightData.itineraries?.[0]?.duration || 'Duration pending',
                stops: flightData.itineraries?.[0]?.segments?.length - 1 || 0,
                airline: flightData.itineraries?.[0]?.segments?.[0]?.carrierCode || 'N/A',
                airlineName: 'Airline information loading...',
                airlineWebsite: '',
                flightNumber: flightData.itineraries?.[0]?.segments?.[0]?.number || 'N/A',
                aircraft: flightData.aircraft?.type || flightData.itineraries?.[0]?.segments?.[0]?.aircraft?.code || 'Aircraft information pending',
                departureTime: flightData.itineraries?.[0]?.segments?.[0]?.departure?.at || 'TBD',
                arrivalTime: flightData.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.at || 'TBD'
              },
              routeOptimization: {
                efficiency: 'Analysis in progress',
                alternativeRoutes: ['Alternative route analysis pending'],
                timeVsPrice: 'Optimization analysis will be available shortly',
                bestDealTimes: ['Check back for booking recommendations'],
                seasonalTrends: ['Seasonal analysis loading...']
              },
              carbonFootprint: {
                totalEmissions: 'Calculating emissions...',
                perPassenger: 'Per-passenger calculation pending',
                comparison: 'Comparison with route average pending',
                offsetCost: 'Offset cost calculation in progress',
                ecoTips: ['Choose direct flights when possible', 'Pack light to reduce fuel consumption'],
                airlineEfficiency: 'Efficiency data loading...'
              }
            };
            
            // console.log('🔄 Using fallback data due to API parsing issues');
            const validatedData = validateAndNormalizeApiData(fallbackData, flightData);
            
            if (validatedData) {
              // console.log('✅ Setting fallback insights data in UI');
              setInsights(validatedData as InsightData);
              // Cache the fallback data
              setAIInsights(flightId, validatedData);
              return;
            }
          }
          
          let troubleshooting = '';

          if (errorMessage.toLowerCase().includes('api key')) {
            troubleshooting = 'Check your .env file for VITE_SONAR_API_KEY.';
          } else if (errorMessage.toLowerCase().includes('network')) {
            troubleshooting = 'Check your internet connection and DNS settings.';
          } else if (errorMessage.toLowerCase().includes('403') || errorMessage.toLowerCase().includes('unauthorized')) {
            troubleshooting = 'Your Perplexity API key may be invalid or expired.';
          } else if (errorMessage.toLowerCase().includes('429')) {
            troubleshooting = 'Rate limit exceeded. Please wait a moment before trying again.';
          }

          const errorText = `Unable to fetch real-time flight intelligence. ${errorMessage}${
            additionalInfo ? ` (${additionalInfo})` : ''
          }${troubleshooting ? `\nTroubleshooting: ${troubleshooting}` : ''}`;
          setError(errorText);
          return;
        }

        // console.log('🔍 Processing comprehensive data from Perplexity:', comprehensiveData);
        
        const validatedData = validateAndNormalizeApiData(comprehensiveData, flightData);
        
        if (validatedData) {
          // console.log('✅ Setting insights data in UI:', validatedData);
          setInsights(validatedData as InsightData);
          // Cache the validated data for this flight
          setAIInsights(flightId, validatedData);
        } else {
          setError('Failed to validate API response data. Please try again.');
        }

      } catch (err: any) {
        let troubleshooting = '';
        if (err?.message?.toLowerCase().includes('network')) {
          troubleshooting = 'Check your internet connection and DNS settings.';
        }
        setError(`Failed to fetch real-time AI insights. ${err?.message || ''}${troubleshooting ? `\nTroubleshooting: ${troubleshooting}` : ''}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [isOpen, flightData, currency]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-100 dark:border-dark-border">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-100 dark:border-dark-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Flight Insights</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20 px-6">
              <div className="text-center max-w-md">
                <div className="relative mb-6">
                  <Brain className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analyzing Your Flight</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Our AI is gathering real-time insights about routes, pricing, airports, and travel tips...</p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <span>Analyzing price trends</span>
                  </div>
                  <div className="flex items-center justify-center gap-2" style={{ animationDelay: '0.2s' }}>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span>Checking airport information</span>
                  </div>
                  <div className="flex items-center justify-center gap-2" style={{ animationDelay: '0.4s' }}>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    <span>Finding travel tips</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-6">This usually takes 10-15 seconds</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-line">{error}</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setError(null)}>Try Again</button>
              </div>
            </div>
          ) : insights ? (
            <div className="p-6">
              <DataQualityBanner insights={insights} />
              {/* Tab Navigation - Horizontal Scroll */}
              <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 pb-2">
                {tabList.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as TabKey)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === key ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-dark-card text-gray-800 dark:text-gray-200'}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />{label}
                  </button>
                ))}
              </div>
              
              <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                      <SectionTitle icon={Info}>Flight Summary</SectionTitle>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{insights.summary}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <DataBadge 
                          ok={Boolean(insights.summary && !['pending', 'unavailable', 'analysis pending', 'Flight analysis completed'].some(indicator => insights.summary?.toLowerCase().includes(indicator.toLowerCase())))} 
                          label="Summary" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.priceAnalysis?.recommendation && !['pending', 'unavailable', 'analysis pending'].some(indicator => insights.priceAnalysis.recommendation?.toLowerCase().includes(indicator.toLowerCase())))} 
                          label="Price Analysis" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.airports?.departure?.name && !['pending', 'unavailable', 'Airport name pending'].some(indicator => insights.airports?.departure?.name?.includes(indicator)))} 
                          label="Departure Airport" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.airports?.arrival?.name && !['pending', 'unavailable', 'Airport name pending'].some(indicator => insights.airports?.arrival?.name?.includes(indicator)))} 
                          label="Arrival Airport" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.layoverInsights?.activities && insights.layoverInsights.activities.length > 0)} 
                          label="Layover Info" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.airlineAmenities?.meals && insights.airlineAmenities.meals.length > 0)} 
                          label="Airline Amenities" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.otherFeatures?.baggage?.policies && insights.otherFeatures.baggage.policies.length > 0)} 
                          label="Baggage Info" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.travelTips?.beforeDeparture && insights.travelTips.beforeDeparture.length > 0)} 
                          label="Travel Tips" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.routeOptimization?.efficiency && !insights.routeOptimization.efficiency.includes('not available'))} 
                          label="Route Optimization" 
                        />
                        <DataBadge 
                          ok={Boolean(insights.carbonFootprint?.totalEmissions && !insights.carbonFootprint.totalEmissions.includes('not available'))} 
                          label="Carbon Footprint" 
                        />
                      </div>
                    </div>
                    
                    {/* Flight Details */}
                    {insights.flightDetails && (
                      <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                        <SectionTitle icon={Brain}>Flight Details</SectionTitle>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Airline:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {insights.flightDetails.airlineName || insights.flightDetails.airline}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Flight Number:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{insights.flightDetails.flightNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Aircraft:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{insights.flightDetails.aircraft}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{insights.flightDetails.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Stops:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{insights.flightDetails.stops}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Departure:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(insights.flightDetails.departureTime)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Arrival:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(insights.flightDetails.arrivalTime)}</span>
                              </div>
                              {insights.flightDetails.airlineWebsite && (
                                <div className="mt-4">
                                  <a 
                                    href={insights.flightDetails.airlineWebsite} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Visit Airline Website
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Trip Score */}
                    {insights.tripScore && (
                      <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                        <SectionTitle icon={Star}>Trip Score</SectionTitle>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                              {insights.tripScore.overall}/10
                            </div>
                            <div className="space-y-2">
                              {Object.entries(insights.tripScore.breakdown).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center">
                                  <span className="capitalize text-gray-600 dark:text-gray-400">{key}:</span>
                                  <span className="font-medium">{String(value)}/10</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Reasoning</h4>
                            <DataList items={insights.tripScore.reasoning} />
                            <h4 className="font-semibold mb-2 mt-4">Improvements</h4>
                            <DataList items={insights.tripScore.improvements} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Tab */}
                {activeTab === 'price' && insights.priceAnalysis && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                      <SectionTitle icon={DollarSign}>Price Analysis</SectionTitle>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                        Score: {insights.priceAnalysis.score}/10
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{insights.priceAnalysis.recommendation}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Confidence:</span><span className="text-gray-900 dark:text-white">{insights.priceAnalysis.confidence}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Trend:</span><span className="text-gray-900 dark:text-white">{insights.priceAnalysis.historicalTrend}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Vs Route Avg:</span><span className="text-gray-900 dark:text-white">{insights.priceAnalysis.vsRouteAverage}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Vs Airline Avg:</span><span className="text-gray-900 dark:text-white">{insights.priceAnalysis.vsAirlineAverage}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Is Deal:</span><span className="text-gray-900 dark:text-white">{insights.priceAnalysis.isDeal ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Airports Tab */}
                {activeTab === 'airports' && insights.airports && (
                  <div className="space-y-4">
                    {(['departure', 'arrival'] as const).map((type) => {
                      const airport = insights.airports && insights.airports[type];
                      if (!airport) return null;
                      return (
                        <div key={type} className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                          <SectionTitle icon={MapPin}>{type.charAt(0).toUpperCase() + type.slice(1)} Airport: {airport.name}</SectionTitle>
                          <div className="mb-4 flex flex-wrap gap-2">
                            {airport.website && (
                              <a href={airport.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline text-sm font-medium mr-4">Visit Airport Website</a>
                            )}
                            <DataBadge ok={!!airport.name && !airport.name.includes('pending')} label="Name" />
                            <DataBadge ok={!!airport.amenities?.length} label="Amenities" />
                            <DataBadge ok={!!airport.facilities?.length} label="Facilities" />
                            <DataBadge ok={!!airport.lounges?.airlineSpecific?.length} label="Lounges" />
                            <DataBadge ok={!!airport.dining?.restaurants?.length} label="Dining" />
                            <DataBadge ok={!!airport.shopping?.dutyfree?.length} label="Shopping" />
                            <DataBadge ok={!!airport.services?.wifi} label="Services" />
                            <DataBadge ok={!!airport.parking?.shortTerm} label="Parking" />
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <Collapsible title="Basic Information">
                                <div className="space-y-4">
                                  <Collapsible title="Amenities"><DataList items={airport.amenities || []} /></Collapsible>
                                  <Collapsible title="Facilities"><DataList items={airport.facilities || []} /></Collapsible>
                                  <Collapsible title="Transportation">{airport.transportation && Object.keys(airport.transportation).length > 0 ? <DataTable data={airport.transportation} /> : <span className="italic text-gray-400">No data</span>}</Collapsible>
                                  <Collapsible title="Tips"><DataList items={airport.tips || []} /></Collapsible>
                                </div>
                              </Collapsible>
                              
                              <Collapsible title="Lounges & Premium Services">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-semibold mb-2">Airline Lounges</h5>
                                    <DataList items={airport.lounges?.airlineSpecific || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Independent Lounges</h5>
                                    <DataList items={airport.lounges?.independent || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Lounge Amenities</h5>
                                    <DataList items={airport.lounges?.amenities || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Access Requirements</h5>
                                    <DataList items={airport.lounges?.accessRequirements || []} />
                                  </div>
                                </div>
                              </Collapsible>
                              
                              <Collapsible title="Dining Options">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-semibold mb-2">Restaurants</h5>
                                    <DataList items={airport.dining?.restaurants || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Fast Food</h5>
                                    <DataList items={airport.dining?.fastFood || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Cafes</h5>
                                    <DataList items={airport.dining?.cafes || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Bars</h5>
                                    <DataList items={airport.dining?.bars || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Special Dietary Options</h5>
                                    <DataList items={airport.dining?.specialDietary || []} />
                                  </div>
                                </div>
                              </Collapsible>
                            </div>
                            
                            <div>
                              <Collapsible title="Shopping">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-semibold mb-2">Duty-Free</h5>
                                    <DataList items={airport.shopping?.dutyfree || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Retail Stores</h5>
                                    <DataList items={airport.shopping?.retail || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Souvenirs</h5>
                                    <DataList items={airport.shopping?.souvenirs || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Electronics</h5>
                                    <DataList items={airport.shopping?.electronics || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Books & Magazines</h5>
                                    <DataList items={airport.shopping?.books || []} />
                                  </div>
                                </div>
                              </Collapsible>
                              
                              <Collapsible title="Services">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-semibold mb-2">WiFi</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{airport.services?.wifi || 'No WiFi information available'}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Charging Stations</h5>
                                    <DataList items={airport.services?.charging || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Baggage Services</h5>
                                    <DataList items={airport.services?.baggage || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Medical Services</h5>
                                    <DataList items={airport.services?.medical || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Banking</h5>
                                    <DataList items={airport.services?.banking || []} />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Business Services</h5>
                                    <DataList items={airport.services?.businessServices || []} />
                                  </div>
                                </div>
                              </Collapsible>
                              
                              <Collapsible title="Parking">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-semibold mb-2">Short-term Parking</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{airport.parking?.shortTerm || 'No short-term parking information available'}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Long-term Parking</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{airport.parking?.longTerm || 'No long-term parking information available'}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Valet Services</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{airport.parking?.valet || 'No valet information available'}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Reservations</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{airport.parking?.reservations || 'No reservation information available'}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Shuttle Services</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{airport.parking?.shuttles || 'No shuttle information available'}</p>
                                  </div>
                                </div>
                              </Collapsible>
                              
                              <Collapsible title="Security & Sources">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-semibold mb-2">Security Information</h5>
                                    <div className="mb-2"><b>Avg Wait Time:</b> {airport.security?.avgWaitTime}</div>
                                    <div className="mb-2"><b>Peak Hours:</b> <DataList items={airport.security?.peakHours || []} /></div>
                                    <div><b>Tips:</b> <DataList items={airport.security?.tips || []} /></div>
                                  </div>
                                  <div>
                                    <h5 className="font-semibold mb-2">Data Sources</h5>
                                    <DataList items={airport.sources || []} />
                                  </div>
                                </div>
                              </Collapsible>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Layovers Tab */}
                {activeTab === 'layovers' && insights.layoverInsights && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                      <SectionTitle icon={Clock}>Layover Information</SectionTitle>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="mb-2"><b>Duration:</b> {insights.layoverInsights.duration}</div>
                          <div className="mb-2"><b>Airport:</b> {insights.layoverInsights.airport}</div>
                          <div className="mb-2"><b>Exit Allowed:</b> {insights.layoverInsights.exitAllowed}</div>
                          <div className="mb-2"><b>Transit Time:</b> {insights.layoverInsights.transitTime}</div>
                        </div>
                        <div>
                          <Collapsible title="Activities"><DataList items={insights.layoverInsights.activities || []} /></Collapsible>
                          <Collapsible title="Facilities"><DataList items={insights.layoverInsights.facilities || []} /></Collapsible>
                          <Collapsible title="Tips"><DataList items={insights.layoverInsights.tips || []} /></Collapsible>
                        </div>
                      </div>
                      
                      {/* Visa Information */}
                      {insights.layoverInsights.visaInfo && (
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-6">
                          <h4 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <MapPin className="w-5 h-5 mr-2" />
                            Visa Information
                          </h4>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Visa Required:</span>
                                  <span className={`font-medium ${insights.layoverInsights.visaInfo.required ? 'text-red-600' : 'text-green-600'}`}>
                                    {insights.layoverInsights.visaInfo.required ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Transit Visa:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{insights.layoverInsights.visaInfo.transitVisa}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Processing Time:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{insights.layoverInsights.visaInfo.processingTime}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Collapsible title="Requirements">
                                <DataList items={insights.layoverInsights.visaInfo.requirements || []} />
                              </Collapsible>
                              <Collapsible title="Important Notes">
                                <DataList items={insights.layoverInsights.visaInfo.notes || []} />
                              </Collapsible>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Smart Insights Tab */}
                {activeTab === 'smart' && insights.smartInsights && (
                  <div className="space-y-4">
                    {/* Performance Insights */}
                    <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                      <SectionTitle icon={Zap}>Performance Insights</SectionTitle>
                      <Collapsible title="On-Time Performance"><DataTable data={insights.smartInsights.onTimePerformance} /></Collapsible>
                      <Collapsible title="Delay Risk"><DataTable data={insights.smartInsights.delayRisk} /></Collapsible>
                    </div>

                    {/* Route Optimization */}
                    {insights.routeOptimization && (
                      <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                        <SectionTitle icon={MapPin}>Route Optimization</SectionTitle>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <div className="space-y-2 text-sm mb-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Route Efficiency:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{insights.routeOptimization.efficiency}</span>
                              </div>
                              <div className="text-gray-700 dark:text-gray-300">
                                <strong>Time vs Price:</strong> {insights.routeOptimization.timeVsPrice}
                              </div>
                            </div>
                            <Collapsible title="Alternative Routes">
                              <DataList items={insights.routeOptimization.alternativeRoutes || []} />
                            </Collapsible>
                          </div>
                          <div>
                            <Collapsible title="Best Deal Times">
                              <DataList items={insights.routeOptimization.bestDealTimes || []} />
                            </Collapsible>
                            <Collapsible title="Seasonal Trends">
                              <DataList items={insights.routeOptimization.seasonalTrends || []} />
                            </Collapsible>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Carbon Footprint */}
                    {insights.carbonFootprint && (
                      <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                        <SectionTitle icon={Star}>Environmental Impact</SectionTitle>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <div className="space-y-2 text-sm mb-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total Emissions:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{insights.carbonFootprint.totalEmissions}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Per Passenger:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{insights.carbonFootprint.perPassenger}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Vs Route Average:</span>
                                <span className="font-medium text-green-600">{insights.carbonFootprint.comparison}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Offset Cost:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{insights.carbonFootprint.offsetCost}</span>
                              </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <p className="text-sm text-green-800 dark:text-green-300">
                                <strong>Airline Efficiency:</strong> {insights.carbonFootprint.airlineEfficiency}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Collapsible title="Eco-Friendly Tips">
                              <DataList items={insights.carbonFootprint.ecoTips || []} />
                            </Collapsible>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Other Features Tab */}
                {activeTab === 'other' && (
                  <div className="space-y-4">
                    {/* Airline Amenities */}
                    {insights.airlineAmenities && (
                      <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                        <SectionTitle icon={Star}>Airline Amenities</SectionTitle>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Collapsible title="Meals">
                              <DataList items={insights.airlineAmenities.meals || []} />
                            </Collapsible>
                            <Collapsible title="Entertainment">
                              <DataList items={insights.airlineAmenities.entertainment || []} />
                            </Collapsible>
                            <Collapsible title="Amenity Kits">
                              <DataList items={insights.airlineAmenities.amenityKits || []} />
                            </Collapsible>
                          </div>
                          <div>
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2">WiFi & Power</h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><strong>WiFi:</strong> {insights.airlineAmenities.wifi}</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><strong>Power Outlets:</strong> {insights.airlineAmenities.powerOutlets}</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><strong>Seat Comfort:</strong> {insights.airlineAmenities.seatComfort}</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Lounge Access:</strong> {insights.airlineAmenities.loungeAccess}</p>
                            </div>
                            {insights.airlineAmenities.serviceRating && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <p className="text-sm"><strong>Service Rating:</strong> {insights.airlineAmenities.serviceRating}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Baggage */}
                    {insights.otherFeatures?.baggage && (
                      <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                        <SectionTitle icon={Luggage}>Baggage Information</SectionTitle>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Collapsible title="Baggage Policies">
                              <DataList items={insights.otherFeatures.baggage.policies || []} />
                            </Collapsible>
                            <Collapsible title="Baggage Fees">
                              <DataList items={insights.otherFeatures.baggage.fees || []} />
                            </Collapsible>
                          </div>
                          <div>
                            <Collapsible title="Packing Tips">
                              <DataList items={insights.otherFeatures.baggage.tips || []} />
                            </Collapsible>
                            <Collapsible title="Restrictions">
                              <DataList items={insights.otherFeatures.baggage.restrictions || []} />
                            </Collapsible>
                            {insights.otherFeatures.baggage.oversized && (
                              <Collapsible title="Oversized Baggage">
                                <DataList items={insights.otherFeatures.baggage.oversized || []} />
                              </Collapsible>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Travel Tips */}
                    {insights.travelTips && (
                      <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                        <SectionTitle icon={Smile}>Travel Tips</SectionTitle>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Collapsible title="Before Departure">
                              <DataList items={insights.travelTips.beforeDeparture || []} />
                            </Collapsible>
                            <Collapsible title="At Airport">
                              <DataList items={insights.travelTips.atAirport || []} />
                            </Collapsible>
                            <Collapsible title="During Flight">
                              <DataList items={insights.travelTips.duringFlight || []} />
                            </Collapsible>
                            <Collapsible title="At Destination">
                              <DataList items={insights.travelTips.atDestination || []} />
                            </Collapsible>
                          </div>
                          <div>
                            <Collapsible title="Cultural Tips">
                              <DataList items={insights.travelTips.cultural || []} />
                            </Collapsible>
                            <Collapsible title="Weather Advice">
                              <DataList items={insights.travelTips.weather || []} />
                            </Collapsible>
                            <Collapsible title="Currency & Payments">
                              <DataList items={insights.travelTips.currency || []} />
                            </Collapsible>
                            <Collapsible title="Emergency Contacts">
                              <DataList items={insights.travelTips.emergency || []} />
                            </Collapsible>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data Sources */}
                    <div className="bg-gray-50 dark:bg-dark-card rounded-xl p-6">
                      <SectionTitle icon={Info}>Data Sources & Links</SectionTitle>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Official Sources</h4>
                          <div className="space-y-2 text-sm">
                            {insights.airports?.departure?.website && (
                              <div>
                                <a 
                                  href={insights.airports.departure.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Departure Airport Official Website
                                </a>
                              </div>
                            )}
                            {insights.airports?.arrival?.website && (
                              <div>
                                <a 
                                  href={insights.airports.arrival.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Arrival Airport Official Website
                                </a>
                              </div>
                            )}
                            {insights.flightDetails?.airlineWebsite && (
                              <div>
                                <a 
                                  href={insights.flightDetails.airlineWebsite} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Airline Official Website
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Data Quality</h4>
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p>• Real-time data from official sources</p>
                            <p>• Sources include official airline and airport websites</p>
                            <p>• Information updated: {new Date().toLocaleDateString()}</p>
                            <p>• Always verify important details with official sources</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Ready to analyze flight data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
