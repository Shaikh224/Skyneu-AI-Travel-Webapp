import React, { useState, useRef } from 'react';
import { Search, MapPin, Calendar, Users, ArrowLeftRight, SlidersHorizontal, Sparkles, Brain, X } from 'lucide-react';
import FlexibleDateCalendar from './flights/FlexibleDateCalendar';
import airportsData from '../data/airports.json';

interface FlightSearchProps {
  onSearch?: (searchData: any) => void;
}

const FlightSearch: React.FC<FlightSearchProps> = ({ onSearch }) => {
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway' | 'multicity'>('roundtrip');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0
  });
  const [cabinClass, setCabinClass] = useState('economy');
  const [showPassengers, setShowPassengers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [fromIata, setFromIata] = useState('');
  const [toIata, setToIata] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [priceIntelligence, setPriceIntelligence] = useState<any>(null);
  const [showPriceIntelligence, setShowPriceIntelligence] = useState(false);
  const [priceIntelligenceLoading, setPriceIntelligenceLoading] = useState(false);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<any>(null);
  const suggestionCache = useRef<Map<string, any[]>>(new Map());

  const popularDestinations = [
    { code: 'NYC', city: 'New York', country: 'United States', image: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg' },
    { code: 'LON', city: 'London', country: 'United Kingdom', image: 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg' },
    { code: 'PAR', city: 'Paris', country: 'France', image: 'https://images.pexels.com/photos/161853/eiffel-tower-paris-france-tower-161853.jpeg' },
    { code: 'TOK', city: 'Tokyo', country: 'Japan', image: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg' },
    { code: 'DUB', city: 'Dubai', country: 'UAE', image: 'https://images.pexels.com/photos/1470502/pexels-photo-1470502.jpeg' },
    { code: 'SYD', city: 'Sydney', country: 'Australia', image: 'https://images.pexels.com/photos/995765/pexels-photo-995765.jpeg' }
  ];

  // Token is no longer needed in frontend - using secure backend function
  // Airport autocomplete doesn't require authentication

  // Ultra-fast global airport suggestions with intelligent caching
  const fetchAirportSuggestions = async (query: string, setter: (s: any[]) => void) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (!query || query.length < 2) {  // Require at least 2 characters for API call
      setter([]);
      return;
    }

    const queryKey = query.toLowerCase().trim();
    
    // Check cache first for instant results
    if (suggestionCache.current.has(queryKey)) {
      setter(suggestionCache.current.get(queryKey) || []);
      return;
    }

    // Convert airports.json to searchable format as fallback
    const airportsList = Object.values(airportsData.airports).map((airport: any) => ({
      id: airport.iata.toLowerCase(),
      name: airport.name,
      iataCode: airport.iata,
      address: {
        cityName: airport.city,
        countryName: airport.country
      },
      timezone: airport.timezone
    }));

    // Quick matching for instant feedback from local data
    const quickMatches = airportsList.filter(airport => {
      const searchTerm = queryKey;
      const nameMatch = airport.name.toLowerCase().includes(searchTerm);
      const codeMatch = airport.iataCode.toLowerCase().includes(searchTerm);
      const cityMatch = airport.address.cityName.toLowerCase().includes(searchTerm);
      const countryMatch = airport.address.countryName.toLowerCase().includes(searchTerm);
      
      return nameMatch || codeMatch || cityMatch || countryMatch;
    })
    .sort((a, b) => {
      // Sort by relevance: exact code > exact city > starts with code > starts with city > contains
      const aCode = a.iataCode.toLowerCase();
      const bCode = b.iataCode.toLowerCase();
      const aCity = a.address.cityName.toLowerCase();
      const bCity = b.address.cityName.toLowerCase();
      
      if (aCode === queryKey) return -1;
      if (bCode === queryKey) return 1;
      if (aCity === queryKey) return -1;
      if (bCity === queryKey) return 1;
      if (aCode.startsWith(queryKey) && !bCode.startsWith(queryKey)) return -1;
      if (bCode.startsWith(queryKey) && !aCode.startsWith(queryKey)) return 1;
      if (aCity.startsWith(queryKey) && !bCity.startsWith(queryKey)) return -1;
      if (bCity.startsWith(queryKey) && !aCity.startsWith(queryKey)) return 1;
      
      return a.address.cityName.localeCompare(b.address.cityName);
    });

    // Show local matches immediately for instant feedback
    if (quickMatches.length > 0) {
      setter(quickMatches.slice(0, 10));
    }

    // Debounce the Amadeus API call
    debounceTimeout.current = setTimeout(async () => {
      try {
        const functionUrl = import.meta.env.VITE_FLIGHT_SEARCH_FUNCTION_URL;
        
        if (!functionUrl) {
          // If no backend, use local data only
          const fallbackResults = quickMatches.slice(0, 10);
          setter(fallbackResults);
          suggestionCache.current.set(queryKey, fallbackResults);
          return;
        }

        // Call Amadeus Location API through backend
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'airport-search',
            query: query
          })
        });

        if (!response.ok) {
          throw new Error('API call failed');
        }

        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          // Format Amadeus response to match our structure
          const amadeusResults = result.data.map((loc: any) => ({
            id: loc.iataCode?.toLowerCase() || '',
            name: loc.name,
            iataCode: loc.iataCode,
            address: {
              cityName: loc.address?.cityName || '',
              countryName: loc.address?.countryName || ''
            },
            detailedName: loc.detailedName,
            type: loc.type // 'AIRPORT' or 'CITY'
          })).filter((item: any) => item.iataCode); // Only show items with IATA codes

          setter(amadeusResults.slice(0, 10));
          suggestionCache.current.set(queryKey, amadeusResults.slice(0, 10));
        } else {
          // Fallback to local data if Amadeus returns no results
          const fallbackResults = quickMatches.slice(0, 10);
          setter(fallbackResults);
          suggestionCache.current.set(queryKey, fallbackResults);
        }
        
      } catch (error) {
        console.error('Airport search error:', error);
        // Fallback to local matches on error
        const fallbackResults = quickMatches.slice(0, 10);
        setter(fallbackResults);
        suggestionCache.current.set(queryKey, fallbackResults);
      }
    }, 300); // 300ms debounce for responsive search
  };

  // Validate if price range is realistic for air travel
  const validatePriceRange = (minPrice: number, maxPrice: number, currency: string): boolean => {
    // Define realistic price ranges for different currencies
    const priceRanges: Record<string, { min: number; max: number }> = {
      // Popular Currencies
      'INR': { min: 2000, max: 200000 },      // ₹2,000 - ₹2,00,000
      'USD': { min: 50, max: 3000 },          // $50 - $3,000
      'EUR': { min: 50, max: 3000 },          // €50 - €3,000
      'GBP': { min: 50, max: 3000 },          // £50 - £3,000
      
      // Gulf Countries (GCC)
      'AED': { min: 200, max: 12000 },        // د.إ200 - د.إ12,000
      'SAR': { min: 200, max: 12000 },        // ر.س200 - ر.س12,000
      'QAR': { min: 200, max: 12000 },        // ر.ق200 - ر.ق12,000
      'KWD': { min: 15, max: 1000 },          // د.ك15 - د.ك1,000 (high value)
      'BHD': { min: 20, max: 1200 },          // د.ب20 - د.ب1,200 (high value)
      'OMR': { min: 20, max: 1200 },          // ر.ع20 - ر.ع1,200 (high value)
      
      // Asia-Pacific
      'SGD': { min: 70, max: 4000 },          // S$70 - S$4,000
      'HKD': { min: 400, max: 25000 },        // HK$400 - HK$25,000
      'JPY': { min: 5000, max: 500000 },      // ¥5,000 - ¥500,000
      'CNY': { min: 300, max: 20000 },        // ¥300 - ¥20,000
      'KRW': { min: 60000, max: 4000000 },    // ₩60,000 - ₩4,000,000
      'THB': { min: 1500, max: 100000 },      // ฿1,500 - ฿100,000
      'MYR': { min: 200, max: 12000 },        // RM200 - RM12,000
      'IDR': { min: 750000, max: 50000000 },  // Rp750,000 - Rp50,000,000
      'PHP': { min: 2500, max: 150000 },      // ₱2,500 - ₱150,000
      
      // Americas
      'CAD': { min: 70, max: 4000 },          // C$70 - C$4,000
      'MXN': { min: 1000, max: 60000 },       // $1,000 - $60,000
      'BRL': { min: 250, max: 15000 },        // R$250 - R$15,000
      'ARS': { min: 20000, max: 1200000 },    // $20,000 - $1,200,000
      
      // Oceania
      'AUD': { min: 70, max: 4500 },          // A$70 - A$4,500
      'NZD': { min: 80, max: 5000 },          // NZ$80 - NZ$5,000
      
      // Africa & Others
      'ZAR': { min: 800, max: 50000 },        // R800 - R50,000
      'EGP': { min: 1500, max: 90000 },       // E£1,500 - E£90,000
      'NGN': { min: 25000, max: 1500000 },    // ₦25,000 - ₦1,500,000
      'TRY': { min: 1500, max: 90000 },       // ₺1,500 - ₺90,000
      'CHF': { min: 50, max: 3000 },          // CHF50 - CHF3,000
      'SEK': { min: 500, max: 30000 },        // kr500 - kr30,000
      'NOK': { min: 500, max: 30000 },        // kr500 - kr30,000
      'DKK': { min: 350, max: 22000 },        // kr350 - kr22,000
    };

    const range = priceRanges[currency] || priceRanges['USD'];
    
    // Check if prices are within realistic range
    const isValidMin = minPrice >= range.min && minPrice <= range.max;
    const isValidMax = maxPrice >= range.min && maxPrice <= range.max;
    const isMinLessThanMax = minPrice <= maxPrice;
    
    // Additional check: max price should not be more than 10x min price (for international routes)
    const isReasonableRange = maxPrice <= (minPrice * 10);
    
    console.log(`Price validation for ${currency}: min=${minPrice}, max=${maxPrice}, valid=${isValidMin && isValidMax && isMinLessThanMax && isReasonableRange}`);
    
    return isValidMin && isValidMax && isMinLessThanMax && isReasonableRange;
  };

  // Helper function to convert prices to USD for display
  const convertToUSD = (price: number, fromCurrency: string): number => {
    // Current conversion rates (as of 2024)
    const conversionRates: Record<string, number> = {
      // Popular Currencies
      'INR': 0.012,     // 1 INR = 0.012 USD
      'USD': 1.0,       // 1 USD = 1 USD
      'EUR': 1.08,      // 1 EUR = 1.08 USD
      'GBP': 1.27,      // 1 GBP = 1.27 USD
      
      // Gulf Countries (GCC)
      'AED': 0.27,      // 1 AED = 0.27 USD
      'SAR': 0.27,      // 1 SAR = 0.27 USD
      'QAR': 0.27,      // 1 QAR = 0.27 USD
      'KWD': 3.27,      // 1 KWD = 3.27 USD (high value)
      'BHD': 2.65,      // 1 BHD = 2.65 USD (high value)
      'OMR': 2.60,      // 1 OMR = 2.60 USD (high value)
      
      // Asia-Pacific
      'SGD': 0.74,      // 1 SGD = 0.74 USD
      'HKD': 0.13,      // 1 HKD = 0.13 USD
      'JPY': 0.0067,    // 1 JPY = 0.0067 USD
      'CNY': 0.14,      // 1 CNY = 0.14 USD
      'KRW': 0.00075,   // 1 KRW = 0.00075 USD
      'THB': 0.028,     // 1 THB = 0.028 USD
      'MYR': 0.22,      // 1 MYR = 0.22 USD
      'IDR': 0.000063,  // 1 IDR = 0.000063 USD
      'PHP': 0.018,     // 1 PHP = 0.018 USD
      
      // Americas
      'CAD': 0.74,      // 1 CAD = 0.74 USD
      'MXN': 0.058,     // 1 MXN = 0.058 USD
      'BRL': 0.20,      // 1 BRL = 0.20 USD
      'ARS': 0.0011,    // 1 ARS = 0.0011 USD
      
      // Oceania
      'AUD': 0.66,      // 1 AUD = 0.66 USD
      'NZD': 0.61,      // 1 NZD = 0.61 USD
      
      // Africa & Others
      'ZAR': 0.054,     // 1 ZAR = 0.054 USD
      'EGP': 0.020,     // 1 EGP = 0.020 USD
      'NGN': 0.00080,   // 1 NGN = 0.00080 USD
      'TRY': 0.031,     // 1 TRY = 0.031 USD
      'CHF': 1.14,      // 1 CHF = 1.14 USD
      'SEK': 0.095,     // 1 SEK = 0.095 USD
      'NOK': 0.094,     // 1 NOK = 0.094 USD
      'DKK': 0.14,      // 1 DKK = 0.14 USD
    };
    
    const rate = conversionRates[fromCurrency] || 1.0;
    return Math.round(price * rate);
  };

  // Real-time price intelligence using Sonar API with web search
  const getPriceIntelligence = async (from: string, to: string, date: string) => {
    if (!from || !to || !date) return null;
    
    const sonarApiKey = import.meta.env.VITE_SONAR_API_KEY;
    if (!sonarApiKey) {
      console.warn('Sonar API key not configured');
      return null;
    }
    
    try {
      console.log(`🔍 Fetching price intelligence for ${from} to ${to} on ${date} in ${currency}`);
      
      const pricePrompt = `
        Search the web for REAL, CURRENT flight prices for ${from} to ${to} on ${date}.
        
        IMPORTANT: Find actual prices from these specific booking sites:
        - Expedia.com
        - Kayak.com  
        - Google Flights
        - Skyscanner.com
        - MakeMyTrip.com (for India routes)
        - Cleartrip.com (for India routes)
        
        Look for:
        1. Economy class one-way ticket prices in ${currency}
        2. Prices from major airlines (Air India, IndiGo, SpiceJet, Vistara for India routes)
        3. Current booking prices (not historical or estimated)
        4. Real price ranges from different airlines and booking sites
        
        CRITICAL: Prices must be realistic for air travel and in the requested currency (${currency}):
        ${currency === 'INR' ? `
        - For India domestic routes: ₹2,000-15,000
        - For India international routes: ₹15,000-100,000+
        - If you find prices like ₹49 or ₹398, these are NOT real flight prices
        ` : currency === 'USD' ? `
        - For US domestic routes: $100-800
        - For US international routes: $300-2000+
        - If you find prices like $49 or $398, these might be real for short domestic flights
        ` : `
        - Prices should be realistic for air travel in ${currency}
        - Minimum prices should be reasonable for the distance and route
        `}
        
        IMPORTANT: Return prices ONLY in ${currency}. If you find prices in other currencies, convert them to ${currency} using current exchange rates.
        
        Respond ONLY with verified pricing data in this exact JSON format:
        {
          "expectedPriceRange": {"min": "realistic_min_price", "max": "realistic_max_price", "currency": "${currency}"},
          "bestBookingWindow": "based on actual booking data",
          "currentTrend": "increasing/decreasing/stable",
          "alternativeDates": [{"date": "YYYY-MM-DD", "estimatedSavings": "realistic savings"}],
          "alternativeAirports": [{"from": "CODE", "to": "CODE", "estimatedSavings": "realistic savings"}],
          "recommendation": "based on real market data",
          "marketAnalysis": "current market conditions",
          "dataSource": "specific booking sites checked",
          "lastUpdated": "${new Date().toISOString()}"
        }
        
        If you cannot find realistic flight prices, return null instead of fake data.
      `;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sonarApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: 'You are a real-time flight pricing analyst with access to current airline and booking site data. Only provide verified, current market information.' },
            { role: 'user', content: pricePrompt }
          ],
          temperature: 0.1,
          max_tokens: 1000,
          web_search: true
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate that we got real data and realistic prices
            if (parsed.expectedPriceRange && parsed.expectedPriceRange.min !== null) {
              const minPrice = parseFloat(parsed.expectedPriceRange.min);
              const maxPrice = parseFloat(parsed.expectedPriceRange.max);
              
              // Check if prices are realistic for air travel
              const isRealistic = validatePriceRange(minPrice, maxPrice, currency);
              
              if (isRealistic) {
                console.log('✅ Real price intelligence received:', parsed);
                return parsed;
              } else {
                console.warn('⚠️ Unrealistic prices received, ignoring:', { minPrice, maxPrice, currency });
                return null;
              }
            }
          }
        } catch (parseError) {
          console.error('Failed to parse price intelligence:', parseError);
        }
      } else {
        const errorText = await response.text();
        console.error('Sonar API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Price intelligence error:', error);
    }
    
    return null;
  };

  // Form validation
  const isFormValid =
    fromIata && toIata && fromIata !== toIata && departDate && passengers.adults > 0 &&
    (tripType !== 'roundtrip' || returnDate);

  const handleSearch = () => {
    if (!isFormValid) return;
    const searchData = {
      tripType,
      from: fromIata,
      to: toIata,
      departDate,
      returnDate,
      passengers,
      cabinClass,
      currency
    };
    if (onSearch) {
      onSearch(searchData);
    }
    
  };

  const swapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const getTotalPassengers = () => {
    return passengers.adults + passengers.children + passengers.infants;
  };

  return (
    <div className="relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-skyneu-light/20 to-skyneu-blue/5 dark:from-dark-surface dark:via-dark-surface/80 dark:to-dark-bg rounded-3xl"></div>
      
      <div className="relative bg-white/90 dark:bg-dark-surface/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/60 dark:border-dark-border p-4 sm:p-6 lg:p-8">
        {/* AI Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-sm font-medium border border-skyneu-blue/20">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI-Powered Search</span>
            <span className="sm:hidden">AI Search</span>
          </div>
          <div className="text-xs text-skyneu-text dark:text-dark-text-secondary text-center sm:text-right">
            <div className="font-medium">Searching 500+ airlines worldwide</div>
            <div className="text-skyneu-green">✓ Best price guarantee</div>
          </div>
        </div>

        {/* Trip Type Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'roundtrip', label: 'Round Trip', icon: '↔️', shortLabel: 'Round' },
            { key: 'oneway', label: 'One Way', icon: '→', shortLabel: 'One Way' },
            { key: 'multicity', label: 'Multi-City', icon: '🌍', shortLabel: 'Multi' }
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => setTripType(type.key as any)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                tripType === type.key
                  ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-blue/80 text-white shadow-lg transform scale-105'
                  : 'bg-white/80 dark:bg-dark-surface/80 text-skyneu-text dark:text-dark-text-secondary hover:bg-skyneu-blue/10 dark:hover:bg-skyneu-blue/20 hover:text-skyneu-blue border border-gray-200 dark:border-dark-border'
              }`}
            >
              <span className="text-sm sm:text-base">{type.icon}</span>
              <span className="text-sm sm:text-base hidden sm:inline">{type.label}</span>
              <span className="text-sm sm:hidden">{type.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Main Search Form - Responsive Grid */}
        <div className="space-y-4 mb-6">
          {/* Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* From Location */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">From</label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary h-5 w-5 group-focus-within:text-skyneu-blue transition-colors" />
                <input
                  type="text"
                  ref={fromInputRef}
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setFromIata('');
                    fetchAirportSuggestions(e.target.value, setFromSuggestions);
                  }}
                  placeholder="Departure city or airport"
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-sm sm:text-base text-skyneu-dark dark:text-dark-text"
                  autoComplete="off"
                />
              </div>
              {fromSuggestions.length > 0 && (
                <ul className="absolute z-50 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl mt-1 w-full shadow-lg max-h-60 overflow-auto">
                  {fromSuggestions.map((s) => (
                    <li
                      key={s.id}
                      className="px-4 py-3 cursor-pointer hover:bg-skyneu-light dark:hover:bg-dark-border transition-colors group"
                      onClick={() => {
                        setFrom(`${s.name} (${s.iataCode})`);
                        setFromIata(s.iataCode);
                        setFromSuggestions([]);
                        fromInputRef.current?.blur();
                        // Trigger price intelligence if we have destination
                        if (toIata && departDate) {
                          setPriceIntelligenceLoading(true);
                          getPriceIntelligence(s.iataCode, toIata, departDate).then(intelligence => {
                            if (intelligence) {
                              setPriceIntelligence(intelligence);
                              setShowPriceIntelligence(true);
                            }
                            setPriceIntelligenceLoading(false);
                          }).catch(() => {
                            setPriceIntelligenceLoading(false);
                          });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-skyneu-dark dark:text-dark-text">
                            {s.name} ({s.iataCode})
                          </div>
                          <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                            {s.address?.cityName || s.address?.countryName}
                          </div>
                        </div>
                        {s.relevanceScore && s.relevanceScore > 0.8 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Best Match</span>
                          </div>
                        )}
                        {s.reason && s.reason !== 'amadeus_match' && (
                          <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            {s.reason === 'exact_match' ? 'Exact' : 
                             s.reason === 'popular' ? 'Popular' : 
                             s.reason === 'phonetic' ? 'Similar' : 'AI'}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Swap Button */}
            <div className="lg:col-span-1 flex items-end justify-center pb-1 order-3 sm:order-2">
              <button
                onClick={swapLocations}
                className="p-3 rounded-full bg-gradient-to-r from-skyneu-light dark:from-dark-surface to-white dark:to-dark-surface hover:from-skyneu-blue hover:to-skyneu-blue/80 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 border border-gray-200 dark:border-dark-border"
              >
                <ArrowLeftRight className="h-5 w-5 text-skyneu-dark dark:text-dark-text" />
              </button>
            </div>

            {/* To Location */}
            <div className="lg:col-span-2 order-2 sm:order-3">
              <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">To</label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary h-5 w-5 group-focus-within:text-skyneu-blue transition-colors" />
                <input
                  type="text"
                  ref={toInputRef}
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setToIata('');
                    fetchAirportSuggestions(e.target.value, setToSuggestions);
                  }}
                  placeholder="Destination city or airport"
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-sm sm:text-base text-skyneu-dark dark:text-dark-text"
                  autoComplete="off"
                />
              </div>
              {toSuggestions.length > 0 && (
                <ul className="absolute z-50 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl mt-1 w-full shadow-lg max-h-60 overflow-auto">
                  {toSuggestions.map((s) => (
                    <li
                      key={s.id}
                      className="px-4 py-3 cursor-pointer hover:bg-skyneu-light dark:hover:bg-dark-border transition-colors group"
                      onClick={() => {
                        setTo(`${s.name} (${s.iataCode})`);
                        setToIata(s.iataCode);
                        setToSuggestions([]);
                        toInputRef.current?.blur();
                        // Trigger price intelligence if we have origin
                        if (fromIata && departDate) {
                          getPriceIntelligence(fromIata, s.iataCode, departDate).then(intelligence => {
                            if (intelligence) {
                              setPriceIntelligence(intelligence);
                              setShowPriceIntelligence(true);
                            }
                          });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-skyneu-dark dark:text-dark-text">
                            {s.name} ({s.iataCode})
                          </div>
                          <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                            {s.address?.cityName || s.address?.countryName}
                          </div>
                        </div>
                        {s.relevanceScore && s.relevanceScore > 0.8 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Best Match</span>
                          </div>
                        )}
                        {s.reason && s.reason !== 'amadeus_match' && (
                          <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            {s.reason === 'exact_match' ? 'Exact' : 
                             s.reason === 'popular' ? 'Popular' : 
                             s.reason === 'phonetic' ? 'Similar' : 'AI'}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Date and Passenger Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Departure Date */}
            <div>
              <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Departure</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary h-5 w-5 group-focus-within:text-skyneu-blue transition-colors" />
                <input
                  type="date"
                  value={departDate}
                  onChange={(e) => {
                    setDepartDate(e.target.value);
                    // Trigger price intelligence when date changes
                    if (fromIata && toIata && e.target.value) {
                      getPriceIntelligence(fromIata, toIata, e.target.value).then(intelligence => {
                        if (intelligence) {
                          setPriceIntelligence(intelligence);
                          setShowPriceIntelligence(true);
                        }
                      });
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-sm sm:text-base text-skyneu-dark dark:text-dark-text"
                />
              </div>
            </div>

            {/* Return Date */}
            {tripType === 'roundtrip' && (
              <div>
                <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Return</label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary h-5 w-5 group-focus-within:text-skyneu-blue transition-colors" />
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-sm sm:text-base text-skyneu-dark dark:text-dark-text"
                  />
                </div>
              </div>
            )}

            {/* Passengers */}
            <div className="relative">
              <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Passengers</label>
              <button
                onClick={() => setShowPassengers(!showPassengers)}
                className="w-full flex items-center justify-between pl-10 pr-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent text-left bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-sm sm:text-base text-skyneu-dark dark:text-dark-text"
              >
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary h-5 w-5" />
                <span className="font-medium">{getTotalPassengers()} Passenger{getTotalPassengers() > 1 ? 's' : ''}</span>
                <span className="text-skyneu-text dark:text-dark-text-secondary">▼</span>
              </button>

              {showPassengers && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-sm border border-gray-200 dark:border-dark-border rounded-xl shadow-xl p-4 z-30">
                  <div className="space-y-4">
                    {[
                      { key: 'adults', label: 'Adults (12+)', min: 1 },
                      { key: 'children', label: 'Children (2-11)', min: 0 },
                      { key: 'infants', label: 'Infants (0-2)', min: 0 }
                    ].map((type) => (
                      <div key={type.key} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-skyneu-dark dark:text-dark-text">{type.label}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPassengers(prev => ({ 
                              ...prev, 
                              [type.key]: Math.max(type.min, prev[type.key as keyof typeof prev] - 1) 
                            }))}
                            className="w-8 h-8 rounded-full bg-skyneu-light dark:bg-dark-border hover:bg-skyneu-blue hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium text-skyneu-dark dark:text-dark-text">{passengers[type.key as keyof typeof passengers]}</span>
                          <button
                            onClick={() => setPassengers(prev => ({ 
                              ...prev, 
                              [type.key]: prev[type.key as keyof typeof prev] + 1 
                            }))}
                            className="w-8 h-8 rounded-full bg-skyneu-light dark:bg-dark-border hover:bg-skyneu-blue hover:text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cabin Class */}
            <div>
              <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Class</label>
              <select
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-sm sm:text-base text-skyneu-dark dark:text-dark-text"
              >
                <option value="economy">Economy</option>
                <option value="premium-economy">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md text-sm sm:text-base text-skyneu-dark dark:text-dark-text"
              >
                <optgroup label="Popular Currencies">
                  <option value="USD">🇺🇸 USD - US Dollar</option>
                  <option value="EUR">🇪🇺 EUR - Euro</option>
                  <option value="GBP">🇬🇧 GBP - British Pound</option>
                  <option value="INR">🇮🇳 INR - Indian Rupee</option>
                </optgroup>
                
                <optgroup label="Gulf Countries (GCC)">
                  <option value="AED">🇦🇪 AED - UAE Dirham</option>
                  <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
                  <option value="QAR">🇶🇦 QAR - Qatari Riyal</option>
                  <option value="KWD">🇰🇼 KWD - Kuwaiti Dinar</option>
                  <option value="BHD">🇧🇭 BHD - Bahraini Dinar</option>
                  <option value="OMR">🇴🇲 OMR - Omani Rial</option>
                </optgroup>
                
                <optgroup label="Asia-Pacific">
                  <option value="SGD">🇸🇬 SGD - Singapore Dollar</option>
                  <option value="HKD">🇭🇰 HKD - Hong Kong Dollar</option>
                  <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                  <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                  <option value="KRW">🇰🇷 KRW - South Korean Won</option>
                  <option value="THB">🇹🇭 THB - Thai Baht</option>
                  <option value="MYR">🇲🇾 MYR - Malaysian Ringgit</option>
                  <option value="IDR">🇮🇩 IDR - Indonesian Rupiah</option>
                  <option value="PHP">🇵🇭 PHP - Philippine Peso</option>
                </optgroup>
                
                <optgroup label="Americas">
                  <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                  <option value="MXN">🇲🇽 MXN - Mexican Peso</option>
                  <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
                  <option value="ARS">🇦🇷 ARS - Argentine Peso</option>
                </optgroup>
                
                <optgroup label="Oceania">
                  <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                  <option value="NZD">🇳🇿 NZD - New Zealand Dollar</option>
                </optgroup>
                
                <optgroup label="Africa & Others">
                  <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
                  <option value="EGP">🇪🇬 EGP - Egyptian Pound</option>
                  <option value="NGN">🇳🇬 NGN - Nigerian Naira</option>
                  <option value="TRY">🇹🇷 TRY - Turkish Lira</option>
                  <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                  <option value="SEK">🇸🇪 SEK - Swedish Krona</option>
                  <option value="NOK">🇳🇴 NOK - Norwegian Krone</option>
                  <option value="DKK">🇩🇰 DKK - Danish Krone</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Price Intelligence Panel */}
        {showPriceIntelligence && (
          <>
            {priceIntelligenceLoading && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-blue-700 dark:text-blue-300">Fetching real-time pricing data...</span>
                </div>
              </div>
            )}
            
            {priceIntelligence && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Price Intelligence
              </h4>
              <button
                onClick={() => setShowPriceIntelligence(false)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Expected Price Range */}
              <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-200 mb-1">Expected Price</h5>
                <p className="text-lg font-bold text-blue-600">
                  ${convertToUSD(parseFloat(priceIntelligence.expectedPriceRange?.min || '0'), priceIntelligence.expectedPriceRange?.currency || 'USD')} - {convertToUSD(parseFloat(priceIntelligence.expectedPriceRange?.max || '0'), priceIntelligence.expectedPriceRange?.currency || 'USD')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Prices converted to USD
                </p>
              </div>
              
              {/* Best Booking Window */}
              <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-200 mb-1">Best Booking Time</h5>
                <p className="text-sm font-medium text-blue-600">{priceIntelligence.bestBookingWindow}</p>
              </div>
              
              {/* Current Trend */}
              <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-200 mb-1">Price Trend</h5>
                <p className={`text-sm font-medium capitalize ${
                  priceIntelligence.currentTrend === 'increasing' ? 'text-red-600' :
                  priceIntelligence.currentTrend === 'decreasing' ? 'text-green-600' :
                  'text-yellow-600'
                }`}>
                  {priceIntelligence.currentTrend}
                </p>
              </div>
            </div>
            
            {/* Recommendation */}
            <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800 mb-3">
              <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-200 mb-1">AI Recommendation</h5>
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary">{priceIntelligence.recommendation}</p>
            </div>
            
            {/* Alternative Options */}
            {(priceIntelligence.alternativeDates?.length > 0 || priceIntelligence.alternativeAirports?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {priceIntelligence.alternativeDates?.length > 0 && (
                  <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-200 mb-2">Better Dates</h5>
                    {priceIntelligence.alternativeDates.slice(0, 2).map((alt: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 dark:text-dark-text-secondary">{alt.date}</span>
                        <span className="text-green-600 font-medium">Save {alt.estimatedSavings}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {priceIntelligence.alternativeAirports?.length > 0 && (
                  <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-200 mb-2">Alternative Routes</h5>
                    {priceIntelligence.alternativeAirports.slice(0, 2).map((alt: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 dark:text-dark-text-secondary">{alt.from} → {alt.to}</span>
                        <span className="text-green-600 font-medium">Save {alt.estimatedSavings}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
            )}
            
            {!priceIntelligenceLoading && !priceIntelligence && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Brain className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Real-time Pricing Unavailable</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    We couldn't fetch current flight prices. Please check booking sites directly for the most accurate pricing.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    <a href="https://www.expedia.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                      Expedia
                    </a>
                    <a href="https://www.kayak.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                      Kayak
                    </a>
                    <a href="https://www.skyscanner.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                      Skyscanner
                    </a>
                    <a href="https://www.makemytrip.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                      MakeMyTrip
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Advanced Filters Toggle */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-dark-border rounded-xl hover:bg-skyneu-light dark:hover:bg-dark-border transition-all duration-300 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm hover:shadow-md text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="font-medium text-skyneu-dark dark:text-dark-text">Advanced Filters</span>
            <span className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''} text-skyneu-text dark:text-dark-text-secondary`}>▼</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gradient-to-br from-skyneu-light/30 dark:from-dark-border/30 to-white/50 dark:to-dark-surface/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/50 dark:border-dark-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Preferred Airlines</label>
                <input
                  type="text"
                  placeholder="Any airline"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue bg-white/80 dark:bg-dark-surface/80 text-sm text-skyneu-dark dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Max Stops</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue bg-white/80 dark:bg-dark-surface/80 text-sm text-skyneu-dark dark:text-dark-text">
                  <option value="any">Any</option>
                  <option value="nonstop">Non-stop</option>
                  <option value="1">1 Stop</option>
                  <option value="2">2+ Stops</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-skyneu-dark dark:text-dark-text mb-2">Price Range</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue bg-white/80 dark:bg-dark-surface/80 text-sm text-skyneu-dark dark:text-dark-text">
                  <option value="any">Any Price</option>
                  <option value="budget">Budget ($0-$500)</option>
                  <option value="mid">Mid-range ($500-$1500)</option>
                  <option value="premium">Premium ($1500+)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full bg-gradient-to-r from-skyneu-blue to-skyneu-blue/80 hover:from-skyneu-blue/90 hover:to-skyneu-blue/70 text-white py-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isFormValid}
        >
          <Search className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="hidden sm:inline">Search Flights with AI</span>
          <span className="sm:hidden">Search with AI</span>
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Flexible Dates Calendar */}
        {fromIata && toIata && departDate && (
          <FlexibleDateCalendar
            fromIata={fromIata}
            toIata={toIata}
            selectedDate={departDate}
            onDateSelect={setDepartDate}
            currency={currency}
          />
        )}

        {/* Popular Destinations */}
        <div>
          <h3 className="font-bold text-skyneu-dark dark:text-dark-text mb-4 flex items-center gap-2 text-base sm:text-lg">
            <span>✈️</span>
            <span className="hidden sm:inline">Popular Destinations</span>
            <span className="sm:hidden">Popular</span>
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {popularDestinations.map((dest, index) => (
              <button
                key={index}
                onClick={() => setTo(`${dest.city}, ${dest.country}`)}
                className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-dark-border hover:border-skyneu-blue transition-all duration-300 hover:shadow-lg transform hover:scale-105"
              >
                <div className="aspect-square relative">
                  <img 
                    src={dest.image} 
                    alt={dest.city}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 text-white">
                    <div className="font-bold text-xs sm:text-sm">{dest.code}</div>
                    <div className="text-xs opacity-90 hidden sm:block">{dest.city}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightSearch;
