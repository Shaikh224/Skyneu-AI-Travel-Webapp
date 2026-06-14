import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, ExternalLink, Globe, Newspaper, Plane, MapPin, RefreshCw, Brain, Cloud, Shield, Clock, Luggage } from 'lucide-react';
import { flightService, authService, SavedFlight } from '@/lib/appwrite';
import airportsData from '@/data/airports.json';
import airlinesData from '@/data/airlines.json';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  relevance?: 'high' | 'medium' | 'low';
  category?: string;
}

interface PerplexityResult {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  relevance: 'high' | 'medium' | 'low';
}

interface CombinedResult {
  id: string;
  title: string;
  description?: string;
  content: string;
  url: string;
  publishedAt: string;
  source: string;
  relevance: 'high' | 'medium' | 'low';
  type: 'news' | 'ai';
}

interface CachedNews {
  results: CombinedResult[];
  timestamp: number;
  sources: string[];
}

const FlightNewsAlerts: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [combinedResults, setCombinedResults] = useState<CombinedResult[]>([]);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [newsCache, setNewsCache] = useState<Map<string, CachedNews>>(new Map());
  const [savedFlights, setSavedFlights] = useState<SavedFlight[]>([]);
  const [newsSources, setNewsSources] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'latest' | 'ai-summary'>('latest');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTopNews, setAiTopNews] = useState<NewsArticle[]>([]);
  const [breakingNews, setBreakingNews] = useState<NewsArticle[]>([]);

  // Cache duration: 15 minutes
  const CACHE_DURATION = 15 * 60 * 1000;
  // Max news articles to show
  const MAX_NEWS_ARTICLES = 12;
  // Only show news from this week (last 7 days)
  const NEWS_RECENCY_DAYS = 7;

  // Get airport and airline information
  const getAirportInfo = useCallback((code: string) => {
    const airports = airportsData.airports as Record<string, any>;
    return airports[code.toUpperCase()] || null;
  }, []);

  const getAirlineInfo = useCallback((code: string) => {
    const airlines = airlinesData.airlines as Record<string, any>;
    return airlines[code.toUpperCase()] || null;
  }, []);

  // Extract airline code from flight number
  const extractAirlineCode = useCallback((flightNumber: string): string => {
    const match = flightNumber.match(/^([A-Z]{2,3})/);
    return match ? match[1] : '';
  }, []);

  // Get the most relevant flight (latest upcoming or active flight)
  const getMostRelevantFlight = useCallback((flights: SavedFlight[]): SavedFlight | null => {
    if (flights.length === 0) return null;

    const now = new Date();
    
    // Filter for active/live flights first
    const liveFlights = flights.filter(flight => flight.isLive);
    if (liveFlights.length > 0) {
      // Return the most recently saved live flight
      return liveFlights.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0];
    }

    // Filter for upcoming flights (not arrived/cancelled)
    const upcomingFlights = flights.filter(flight => {
      if (flight.status === 'arrived' || flight.status === 'cancelled') {
        return false;
      }
      
      if (!flight.departure.scheduledTime) {
        return false;
      }
      
      const departureTime = new Date(flight.departure.scheduledTime);
      const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Only include flights within 48 hours of departure
      return hoursUntilDeparture <= 48 && hoursUntilDeparture > -24;
    });

    if (upcomingFlights.length > 0) {
      // Return the flight with the nearest departure time
      return upcomingFlights.sort((a, b) => {
        const timeA = new Date(a.departure.scheduledTime!).getTime();
        const timeB = new Date(b.departure.scheduledTime!).getTime();
        return timeA - timeB;
      })[0];
    }

    // Fallback: return the most recently saved flight
    return flights.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0];
  }, []);

  // Load saved flights from Appwrite
  const loadSavedFlights = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        
        return [];
      }

      const flights = await flightService.getSavedFlights(currentUser.$id);
      
      setSavedFlights(flights);
      return flights;
    } catch (error) {
      // swallow
      return [];
    }
  }, []);

  // Generate comprehensive news sources from saved flights
  const generateNewsSources = useCallback((flights: SavedFlight[]): string[] => {
    const sources = new Set<string>();
    
    flights.slice(0, 5).forEach(flight => { // Limit to top 5 flights for performance
      try {
        // Add airline with disruption keywords
        const airlineCode = extractAirlineCode(flight.flightNumber);
        const airlineInfo = getAirlineInfo(airlineCode);
        if (airlineInfo?.name) {
          sources.add(airlineInfo.name);
          sources.add(`${airlineInfo.name} strike delay`);
          sources.add(`${airlineInfo.name} flight disruption`);
        }

        // Add departure airport/city/country with weather focus
        if (flight.departure?.airport) {
          const depAirport = getAirportInfo(flight.departure.airport);
          if (depAirport) {
            if (depAirport.city) {
              sources.add(depAirport.city);
              sources.add(`${depAirport.city} weather aviation`);
              sources.add(`${depAirport.city} airport weather`);
              sources.add(`${depAirport.city} flight delay weather`);
            }
            if (depAirport.country) {
              sources.add(depAirport.country);
              sources.add(`${depAirport.country} travel restrictions`);
              sources.add(`${depAirport.country} visa rules`);
            }
          }
          sources.add(flight.departure.airport); // Airport code
          sources.add(`${flight.departure.airport} weather`);
        }

        // Add arrival airport/city/country with weather focus
        if (flight.arrival?.airport) {
          const arrAirport = getAirportInfo(flight.arrival.airport);
          if (arrAirport) {
            if (arrAirport.city) {
              sources.add(arrAirport.city);
              sources.add(`${arrAirport.city} weather aviation`);
              sources.add(`${arrAirport.city} airport weather`);
              sources.add(`${arrAirport.city} flight delay weather`);
            }
            if (arrAirport.country) {
              sources.add(arrAirport.country);
              sources.add(`${arrAirport.country} travel restrictions`);
              sources.add(`${arrAirport.country} visa rules`);
            }
          }
          sources.add(flight.arrival.airport); // Airport code
          sources.add(`${flight.arrival.airport} weather`);
        }

        // Add route with comprehensive keywords
        if (flight.departure?.airport && flight.arrival?.airport) {
          sources.add(`${flight.departure.airport} to ${flight.arrival.airport}`);
          if (flight.departure.airportCity && flight.arrival.airportCity) {
            sources.add(`${flight.departure.airportCity} to ${flight.arrival.airportCity} flight`);
            sources.add(`${flight.departure.airportCity} ${flight.arrival.airportCity} aviation`);
          }
        }
        
        // Add specific flight number
        sources.add(flight.flightNumber);
      } catch (error) {
        // swallow
      }
    });

    // Only add user-specific aviation keywords - NO GENERAL AVIATION
    // (General aviation keywords removed to focus only on user's travel)

    const sourcesArray = Array.from(sources).slice(0, 15); // Increased limit for comprehensive coverage
    
    return sourcesArray;
  }, [getAirportInfo, getAirlineInfo, extractAirlineCode]);

  // Check cache for existing news
  const getCachedNews = useCallback((sources: string[]): CombinedResult[] | null => {
    const cacheKey = sources.sort().join('|');
    const cached = newsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      
      return cached.results;
    }
    
    return null;
  }, [newsCache, CACHE_DURATION]);

  // Cache news results
  const cacheNews = useCallback((sources: string[], results: CombinedResult[]) => {
    const cacheKey = sources.sort().join('|');
    setNewsCache(prev => new Map(prev).set(cacheKey, {
      results,
      timestamp: Date.now(),
      sources
    }));
  }, []);

  // Auto-fetch news based on saved flights
  const autoFetchNews = useCallback(async (forceRefresh = false) => {
    
    setIsLoading(true);
    setError(null);

    try {
      // Load saved flights
      const flights = await loadSavedFlights();
      if (flights.length === 0) {
        
        setCombinedResults([]);
        setNewsSources([]);
        return;
      }

      // Generate news sources
      const sources = generateNewsSources(flights);
      setNewsSources(sources);
      
      if (sources.length === 0) {
        
        setCombinedResults([]);
        return;
      }

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedResults = getCachedNews(sources);
        if (cachedResults) {
          setCombinedResults(cachedResults);
          return;
        }
      }

      
      const allResults: CombinedResult[] = [];

      // Get the most relevant flight (latest upcoming or active flight)
      const mostRelevantFlight = getMostRelevantFlight(flights);
      if (!mostRelevantFlight) {
        setCombinedResults([]);
        return;
      }

      // Extract relevant terms from the most relevant flight only
      const departureAirports = new Set();
      const arrivalAirports = new Set();
      const cities = new Set();
      const airlines = new Set();
      const flightNumbers = new Set();
      const countries = new Set();
      
      const flight = mostRelevantFlight;
        if (flight.flightNumber) flightNumbers.add(flight.flightNumber);
        
        // Extract departure airport info
        if (flight.departure?.airport) {
          departureAirports.add(flight.departure.airport);
          // Get city and country from airport data if not available in flight data
          const depAirportInfo = getAirportInfo(flight.departure.airport);
          if (depAirportInfo) {
            if (depAirportInfo.city) cities.add(depAirportInfo.city);
            if (depAirportInfo.country) countries.add(depAirportInfo.country);
          }
        }
        
        // Extract arrival airport info
        if (flight.arrival?.airport) {
          arrivalAirports.add(flight.arrival.airport);
          // Get city and country from airport data if not available in flight data
          const arrAirportInfo = getAirportInfo(flight.arrival.airport);
          if (arrAirportInfo) {
            if (arrAirportInfo.city) cities.add(arrAirportInfo.city);
            if (arrAirportInfo.country) countries.add(arrAirportInfo.country);
          }
        }
        
        // Extract airline info
        if (flight.airline && typeof flight.airline === 'object' && 'name' in flight.airline) {
          airlines.add(flight.airline.name);
        } else if (flight.flightNumber) {
          // Try to get airline name from flight number
          const airlineCode = extractAirlineCode(flight.flightNumber);
          if (airlineCode) {
            const airlineInfo = getAirlineInfo(airlineCode);
            if (airlineInfo?.name) {
              airlines.add(airlineInfo.name);
              if (airlineInfo.country) countries.add(airlineInfo.country);
            }
          }
        }
        
        // Use flight data if available, otherwise use airport data
        if (flight.departure?.airportCity) cities.add(flight.departure.airportCity);
        if (flight.arrival?.airportCity) cities.add(flight.arrival.airportCity);
        if (flight.departure?.airportCountry) countries.add(flight.departure.airportCountry);
        if (flight.arrival?.airportCountry) countries.add(flight.arrival.airportCountry);
      
      //
      
      // Only search if we have specific flight terms - NO GENERAL AVIATION NEWS
      if (departureAirports.size === 0 && arrivalAirports.size === 0 && airlines.size === 0) {
        setCombinedResults([]);
        return;
      }
      
      // Build comprehensive aviation news queries including airlines, aircraft, and airport cities
      const searchQueries = [] as string[];
      
      // Priority 1: General airline news (most likely to get real news)
      if (airlines.size > 0) {
        const airline = Array.from(airlines)[0] as string;
        const shortAirline = airline.includes('dba') ? airline.split('dba')[1].trim() : airline;
        searchQueries.push(`${shortAirline} airline news delays strikes`);
        searchQueries.push(`${shortAirline} flight delays cancellations`);
        searchQueries.push(`${shortAirline} aviation news today`);
      }
      
      // Priority 2: Departure airport/city news
      if (departureAirports.size > 0) {
        const depAirport = Array.from(departureAirports)[0];
        const depCity = Array.from(cities)[0] || depAirport;
        searchQueries.push(`${depCity} airport flight delays weather`);
        searchQueries.push(`${depAirport} airport aviation news`);
        searchQueries.push(`${depCity} airport operations news`);
      }
      
      // Priority 3: Arrival airport/city news
      if (arrivalAirports.size > 0) {
        const arrAirport = Array.from(arrivalAirports)[0];
        const arrCity = Array.from(cities)[1] || arrAirport;
        searchQueries.push(`${arrCity} airport flight delays weather`);
        searchQueries.push(`${arrAirport} airport aviation news`);
        searchQueries.push(`${arrCity} airport operations news`);
      }
      
      // Priority 4: Country-specific aviation news
      if (countries.size > 0) {
        const countryList = Array.from(countries);
        countryList.forEach(country => {
          searchQueries.push(`${country} aviation industry news`);
          searchQueries.push(`${country} airline news delays`);
        });
      }
      
      // Priority 5: Specific flight if available
      if (flightNumbers.size > 0) {
        const flight = Array.from(flightNumbers)[0];
        searchQueries.push(`flight ${flight} delay cancellation`);
        searchQueries.push(`${flight} airline flight news`);
      }
      
      // Priority 6: Route-specific news
      if (departureAirports.size > 0 && arrivalAirports.size > 0) {
        const depAirport = Array.from(departureAirports)[0];
        const arrAirport = Array.from(arrivalAirports)[0];
        searchQueries.push(`${depAirport} to ${arrAirport} flight route news`);
        searchQueries.push(`${depAirport} ${arrAirport} aviation news`);
      }
      
      //
      
      // Use the most specific query available - NO FALLBACK TO GENERAL AVIATION
      let aviationQuery = searchQueries[0];
      
      // If no specific user terms, don't search at all
      if (!aviationQuery) {
        setCombinedResults([]);
        return;
      }
      
      //
      
      // Ensure query is under 200 characters to leave room for backend enhancements
      if (aviationQuery.length > 200) {
        aviationQuery = aviationQuery.substring(0, 200);
      }
      
      try {
        //
        
        // Try multiple search queries if the first one returns only tracking apps
        
        // Make multiple searches for comprehensive coverage
        const searchPromises = [];
        
        // Search for up to 3 different queries to avoid rate limits
        const queriesToSearch = searchQueries.slice(0, 3);
        for (const q of queriesToSearch) {
          searchPromises.push(searchPerplexity(q));
        }
        
        // Execute all searches in parallel (Perplexity + NewsAPI)
        const allSearchResults = await Promise.allSettled(searchPromises);
        
        // Also fetch from NewsAPI for comprehensive coverage
        const newsApiPromises = [];
        const topQueries = searchQueries.slice(0, 3); // Use top 3 queries for NewsAPI
        for (const query of topQueries) {
          newsApiPromises.push(fetchAviationNews(query));
        }
        
        const newsApiResults = await Promise.allSettled(newsApiPromises);
        
        // Check if NewsAPI key is missing
        const newsApiKey = import.meta.env.VITE_NEWS_API_KEY;
        if (!newsApiKey) {
        
        }
        
        // Process all search results
        const allPerplexityResults = [];
        
        // Collect all Perplexity web search results
        for (let i = 0; i < queriesToSearch.length; i++) {
          if (allSearchResults[i].status === 'fulfilled') {
            const results = (allSearchResults[i] as PromiseFulfilledResult<any>).value;
            // Filter out null/undefined results and results without required fields before adding
            const validResults = results.filter((result: any) => 
              result !== null && 
              result !== undefined && 
              result.title && 
              result.url
            );
            allPerplexityResults.push(...validResults);
          } else {
            //
          }
        }
        
        //
        
        // Check if we have any successful Perplexity results
        // const successfulPerplexityQueries = allSearchResults.filter(result => result.status === 'fulfilled').length;
        // const totalPerplexityQueries = allSearchResults.length;

        // Process NewsAPI results
        const allNewsApiResults = [];
        for (const result of newsApiResults) {
          if (result.status === 'fulfilled') {
            const newsArticles = result.value;
            
            
            // Convert NewsAPI articles to CombinedResult format
            const convertedArticles = newsArticles.map(article => ({
              id: article.id,
              title: article.title,
              description: article.description,
              content: article.content || article.description,
              url: article.url,
              publishedAt: article.publishedAt,
              source: typeof article.source === 'string' ? article.source : article.source.name,
              relevance: article.relevance || 'medium',
              type: 'news' as const
            }));
            
            allNewsApiResults.push(...convertedArticles);
          } else {
            
          }
        }
        
        
        
        //

          // Handle Perplexity Search results with better parsing
          if (allPerplexityResults.length > 0) {
            //
            const perplexityCombined = allPerplexityResults
              .filter(result => result !== null && result !== undefined && result.title) // Filter out null/undefined results and results without titles
              .slice(0, 15)
              .map(result => {
              // Extract proper source name from URL
              let sourceName = 'Web Source';
              try {
                const urlObj = new URL(result.url);
                const hostname = urlObj.hostname.replace('www.', '');
                const domainParts = hostname.split('.');
                let domain = domainParts[0];
                
                // Map to proper news agency names
                const newsAgencies: { [key: string]: string } = {
                  'bbc': 'BBC News',
                  'cnn': 'CNN',
                  'reuters': 'Reuters',
                  'ap': 'Associated Press',
                  'bloomberg': 'Bloomberg',
                  'wsj': 'Wall Street Journal',
                  'nytimes': 'New York Times',
                  'washingtonpost': 'Washington Post',
                  'guardian': 'The Guardian',
                  'independent': 'The Independent',
                  'telegraph': 'The Telegraph',
                  'times': 'The Times',
                  'ft': 'Financial Times',
                  'economist': 'The Economist',
                  'aviationweek': 'Aviation Week',
                  'flightglobal': 'FlightGlobal',
                  'airlineratings': 'Airline Ratings',
                  'simpleflying': 'Simple Flying',
                  'airport-technology': 'Airport Technology',
                  'aviationtoday': 'Aviation Today',
                  'hindustantimes': 'Hindustan Times',
                  'timesofindia': 'Times of India',
                  'indianexpress': 'Indian Express',
                  'cnbctv18': 'CNBC TV18',
                  'economictimes': 'Economic Times',
                  'indiatoday': 'India Today',
                  'ndtv': 'NDTV',
                  'newindianexpress': 'New Indian Express',
                  'mathrubhumi': 'Mathrubhumi',
                  'newdelhiairport': 'Delhi Airport',
                  'airport': 'Airport News',
                  'airline': 'Airline News',
                  'aviation': 'Aviation News'
                };
                
                sourceName = newsAgencies[domain] || domain.charAt(0).toUpperCase() + domain.slice(1);
              } catch (e) {
                // Keep default source name
              }
              
              // Check if result has required fields
              if (!result.title || !result.url) {
                return null;
              }
              
              // Clean and format title
              const cleanTitle = cleanText(result.title);
              
              // Filter out irrelevant content - be more selective
              const titleLower = cleanTitle.toLowerCase();
              
              //
              
              // Filter out tracking apps, booking sites, and general aviation news
              const isTrackingApp = titleLower.includes('flight tracker') ||
                                   titleLower.includes('flight app') ||
                                   titleLower.includes('flightaware') ||
                                   titleLower.includes('flightradar') ||
                                   titleLower.includes('flightstats') ||
                                   titleLower.includes('myflightradar') ||
                                   titleLower.includes('flight status') ||
                                   titleLower.includes('flight monitor') ||
                                   titleLower.includes('live flight') ||
                                   titleLower.includes('real time flight') ||
                                   titleLower.includes('flight details') ||
                                   titleLower.includes('flight information') ||
                                   titleLower.includes('flighty') ||
                                   titleLower.includes('flight data') ||
                                   titleLower.includes('flight tracking') ||
                                   titleLower.includes('flight search') ||
                                   titleLower.includes('trip.com') ||
                                   titleLower.includes('ixigo') ||
                                   titleLower.includes('adanione') ||
                                   titleLower.includes('pnr status') ||
                                   titleLower.includes('flight history');
              
              const isBookingSite = titleLower.includes('book flight') ||
                                   titleLower.includes('flight booking') ||
                                   titleLower.includes('reserve ticket') ||
                                   titleLower.includes('buy ticket') ||
                                   titleLower.includes('flight deals') ||
                                   titleLower.includes('cheap flights') ||
                                   titleLower.includes('flight search') ||
                                   titleLower.includes('flight finder');
              
              const isGeneralAviation = titleLower.includes('aviation industry') ||
                                       titleLower.includes('airline industry') ||
                                       titleLower.includes('airport industry') ||
                                       titleLower.includes('global aviation') ||
                                       titleLower.includes('worldwide aviation') ||
                                       titleLower.includes('aviation market');
              
              // Enhanced post-filtering following best practices
              const urlLower = (result.url || '').toLowerCase();
              
              // Comprehensive blacklist for non-news sites
              const blacklist = [
                'trip.com', 'ixigo.com', 'flightaware.com', 'flightradar24.com', 'tracker',
                'adanione.com', 'flightstats.com', 'myflightradar24.com', 'flighty.com',
                'flightstatus.com', 'flightmonitor.com', 'liveflight.com', 'flightdetails.com',
                'flightinformation.com', 'flighttracker.com', 'flightdata.com', 'flightapp.com',
                'booking.com', 'expedia.com', 'skyscanner.com', 'kayak.com', 'makemytrip.com',
                'downdetector.com', 'isitdownrightnow.com', 'flightview.com', 'flightstats.com',
                'flightmonitor.com', 'flightradar.com', 'flightaware.com', 'flightstats.com',
                'flightview.com', 'flightradar24.com', 'myflightradar24.com', 'flighty.com',
                'reddit.com', 'twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com',
                'youtube.com', 'tiktok.com', 'pinterest.com', 'quora.com', 'stackoverflow.com',
                'github.com', 'wikipedia.org', 'wikimedia.org', 'archive.org', 'wayback',
                'cached', 'cache', 'proxy', 'mirror', 'copy', 'duplicate'
              ];
              
              // Whitelist for trusted news sources
              const newsWhitelist = [
                'bbc.com', 'cnn.com', 'reuters.com', 'ap.org', 'bloomberg.com', 'wsj.com',
                'nytimes.com', 'washingtonpost.com', 'guardian.com', 'independent.co.uk',
                'telegraph.co.uk', 'thetimes.co.uk', 'ft.com', 'economist.com',
                'aviationweek.com', 'flightglobal.com', 'airlineratings.com', 'simpleflying.com',
                'airport-technology.com', 'aviationtoday.com', 'hindustantimes.com',
                'timesofindia.com', 'indianexpress.com', 'cnbctv18.com', 'economictimes.com',
                'indiatoday.com', 'ndtv.com', 'newindianexpress.com', 'mathrubhumi.com',
                'newdelhiairport.com', 'airport.com', 'airline.com', 'aviation.com',
                'news.com', 'news24.com', 'news18.com', 'firstpost.com', 'scroll.in',
                'thehindu.com', 'deccanherald.com', 'tribune.com', 'punjabkesari.com',
                'newsonair.gov.in', 'airindia.com', 'changi.com', 'delhiairport.com'
              ];
              
              const isBlockedDomain = blacklist.some(domain => urlLower.includes(domain));
              
              // Check if it's from a trusted news source
              const isTrustedNewsSource = newsWhitelist.some(domain => urlLower.includes(domain));
              
              //
              
              // Additional title/content filtering for tracker/status content
              const hasTrackerKeywords = titleLower.includes('status') || 
                                       titleLower.includes('tracker') ||
                                       titleLower.includes('live flight') ||
                                       titleLower.includes('flight details') ||
                                       titleLower.includes('pnr status') ||
                                       titleLower.includes('flight history') ||
                                       titleLower.includes('flight tracking') ||
                                       titleLower.includes('is it down') ||
                                       titleLower.includes('downdetector') ||
                                       titleLower.includes('real time flight') ||
                                       titleLower.includes('flight monitor') ||
                                       titleLower.includes('flight data') ||
                                       titleLower.includes('flight information');

              // Filter out tracking apps, booking sites, general aviation news, blocked domains, and tracker keywords
              // Also require either trusted news source OR aviation-specific content
              if (isTrackingApp || isBookingSite || isGeneralAviation || isBlockedDomain || hasTrackerKeywords) {
                return null; // Skip this result
              }
              
              // If not from a trusted news source, check if it has aviation-specific content
              if (!isTrustedNewsSource) {
                const hasAviationContent = titleLower.includes('airline') || 
                                         titleLower.includes('aviation') || 
                                         titleLower.includes('flight') || 
                                         titleLower.includes('aircraft') || 
                                         titleLower.includes('airport') ||
                                         titleLower.includes('airways') ||
                                         titleLower.includes('pilot') ||
                                         titleLower.includes('crew') ||
                                         titleLower.includes('air india') ||
                                         titleLower.includes('singapore') ||
                                         titleLower.includes('delhi') ||
                                         titleLower.includes('changi') ||
                                         titleLower.includes('indira gandhi') ||
                                         titleLower.includes('ai2381') ||
                                         titleLower.includes('sin') ||
                                         titleLower.includes('del');
                
                if (!hasAviationContent) {
                  return null;
                }
              }
              
              // Determine relevance based on content - prioritize aviation news
              let relevance: 'high' | 'medium' | 'low' = 'low';
              
              // High relevance: Critical aviation events
              if (titleLower.includes('delay') || titleLower.includes('cancellation') || 
                  titleLower.includes('strike') || titleLower.includes('weather') ||
                  titleLower.includes('disruption') || titleLower.includes('emergency') ||
                  titleLower.includes('grounded') || titleLower.includes('incident') ||
                  titleLower.includes('safety') || titleLower.includes('accident')) {
                relevance = 'high';
              } 
              // Medium relevance: General aviation news
              else if (titleLower.includes('airport') || titleLower.includes('airline') ||
                       titleLower.includes('flight') || titleLower.includes('aviation') ||
                       titleLower.includes('aircraft') || titleLower.includes('airways') ||
                       titleLower.includes('pilot') || titleLower.includes('crew')) {
                relevance = 'medium';
              }
              // Low relevance: Everything else that passed the filter
              
              return {
                id: result.id || `perplexity-${Math.random().toString(36).substr(2, 9)}`,
                title: cleanTitle,
                content: cleanText(result.content || ''),
              url: result.url,
                publishedAt: result.publishedAt || new Date().toISOString(),
                source: sourceName,
                relevance: relevance,
              type: 'ai' as const
              };
            }).filter(result => result !== null); // Filter out null results
            //
            allResults.push(...perplexityCombined);
          }

          // Add NewsAPI results to the combined results
          if (allNewsApiResults.length > 0) {
            //
            allResults.push(...allNewsApiResults);
          }
        } catch (err) {
        //
      }

      // Remove duplicates and sort by relevance and date
      const uniqueResults = allResults
        .filter(result => {
          try {
            const host = new URL(result.url).hostname.replace('www.','');
            const blocked = ['flightradar24.com','flightaware.com','tripadvisor.com','expedia.com','skyscanner.com','kayak.com','makemytrip.com','cheapflights.com','booking.com'];
            return !blocked.some(d => host.includes(d));
          } catch { return true; }
        })
        .filter(result => {
          // Additional date filtering to ensure only this week's news
          try {
            const publishedDate = new Date(result.publishedAt);
            const now = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - NEWS_RECENCY_DAYS);
            
            return publishedDate >= oneWeekAgo && publishedDate <= now;
          } catch {
            return false; // Skip results with invalid dates
          }
        })
        .filter((result, index, self) => 
        self.findIndex(r => r.title.toLowerCase() === result.title.toLowerCase()) === index
      );

      //

      // If we have very few results, try a more lenient approach
      let finalResults = uniqueResults;
      if (uniqueResults.length < 3) {
        
        // First try with more lenient date filtering
        const moreLenientResults = allResults
          .filter(result => {
            try {
              const host = new URL(result.url).hostname.replace('www.','');
              const blocked = ['flightradar24.com','flightaware.com','tripadvisor.com','expedia.com','skyscanner.com','kayak.com','makemytrip.com','cheapflights.com','booking.com'];
              return !blocked.some(d => host.includes(d));
            } catch { return true; }
          })
          .filter(result => {
            // More lenient date filtering - last 14 days
            try {
              const publishedDate = new Date(result.publishedAt);
              const now = new Date();
              const twoWeeksAgo = new Date();
              twoWeeksAgo.setDate(now.getDate() - 14);
              
              return publishedDate >= twoWeeksAgo && publishedDate <= now;
            } catch {
              return false;
            }
          })
          .filter((result, index, self) => 
            self.findIndex(r => r.title.toLowerCase() === result.title.toLowerCase()) === index
          );
        
        if (moreLenientResults.length > uniqueResults.length) {
          finalResults = moreLenientResults;
        } else if (uniqueResults.length === 0) {
          // If still no results, try with even more lenient content filtering
          
          const veryLenientResults = allResults
            .filter(result => {
              try {
                const host = new URL(result.url).hostname.replace('www.','');
                const blocked = ['flightradar24.com','flightaware.com','tripadvisor.com','expedia.com','skyscanner.com','kayak.com','makemytrip.com','cheapflights.com','booking.com'];
                return !blocked.some(d => host.includes(d));
              } catch { return true; }
            })
            .filter(result => {
              // Very lenient date filtering - last 30 days
              try {
                const publishedDate = new Date(result.publishedAt);
                const now = new Date();
                const oneMonthAgo = new Date();
                oneMonthAgo.setDate(now.getDate() - 30);
                
                return publishedDate >= oneMonthAgo && publishedDate <= now;
              } catch {
                return false;
              }
            })
            .filter((result, index, self) => 
              self.findIndex(r => r.title.toLowerCase() === result.title.toLowerCase()) === index
            );
          
          if (veryLenientResults.length > 0) {
            finalResults = veryLenientResults;
          }
        }
      }

      const sortedResults = finalResults
        .sort((a, b) => {
          const relevanceOrder = { high: 3, medium: 2, low: 1 };
          const relevanceCompare = relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
          if (relevanceCompare !== 0) return relevanceCompare;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        })
        .slice(0, MAX_NEWS_ARTICLES); // Limit to 12 articles

      //
      setCombinedResults(sortedResults);
      setLastFetched(new Date());
      
      // Cache the results
      cacheNews(sources, sortedResults);
      
      
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flight news';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [loadSavedFlights, generateNewsSources, getCachedNews, cacheNews]);

  // Auto-fetch news when component mounts
  useEffect(() => {
    autoFetchNews();
  }, [autoFetchNews]);

  // Build concise prompt from most relevant flight
  const buildAISummaryPrompt = useCallback((flight: SavedFlight): string => {
    const depInfo = getAirportInfo(flight.departure.airport) || {} as any;
    const arrInfo = getAirportInfo(flight.arrival.airport) || {} as any;
    const airlineCode = extractAirlineCode(flight.flightNumber);
    const airlineInfo = getAirlineInfo(airlineCode) || {} as any;

    const depCity = flight.departure.airportCity || depInfo.city || flight.departure.airport;
    const depCountry = flight.departure.airportCountry || depInfo.country || '';
    const arrCity = flight.arrival.airportCity || arrInfo.city || flight.arrival.airport;
    const arrCountry = flight.arrival.airportCountry || arrInfo.country || '';
    const airlineName = flight.airline?.name || airlineInfo.name || airlineCode;

    return `Provide a concise, structured travel briefing for an air traveler. Include ONLY highly relevant items for the next few days.

**Context:**
- Airline: ${airlineName}
- Flight: ${flight.flightNumber}
- Departure: ${depCity}, ${depCountry} (${flight.departure.airport})
- Arrival: ${arrCity}, ${arrCountry} (${flight.arrival.airport})

**Focus areas:**
- Breaking or important local news at departure and arrival cities/countries
- Airport advisories, strikes, security changes, terminal changes, runway/ATC issues
- Weather disruptions (fog, storms, visibility) impacting flights
- Airline operational advisories (strikes, mass delays)
- Immigration, visa, health or travel restrictions relevant this week
- Baggage policies, check-in procedures, on-time performance
- Emergency contact information

**Output format:**
Use these section headings with emoji icons:
✈️ **Flight Status** - departure/arrival times, current status
🏢 **Airport Operations** - terminal, runway, ATC updates
🌤️ **Weather** - conditions affecting travel
🛫 **Airline Advisories** - operational updates, delays
🛡️ **Security** - screening changes, advisories
🌍 **Immigration/Health** - visa, health requirements
📰 **Local News** - relevant breaking news
🎒 **Baggage & Check-In** - policies, timing
📊 **On-Time Performance** - recent history
📞 **Contact** - airline support info

Use bullet points (•) for items. Be specific with dates and details. Omit empty sections. Keep professional and concise.`;
  }, [getAirportInfo, getAirlineInfo, extractAirlineCode]);

  // Call Sonar API to get AI summary
  const fetchAISummary = useCallback(async () => {
    try {
      setAiLoading(true);
      setAiError(null);

      const flights = savedFlights.length ? savedFlights : await loadSavedFlights();
      const mostRelevantFlight = getMostRelevantFlight(flights);
      if (!mostRelevantFlight) {
        setAiSummary('No relevant flight found to summarize.');
        return;
      }

      const sonarKey = (import.meta as any).env.VITE_SONAR_API_KEY;
      if (!sonarKey) {
        setAiSummary('AI summary unavailable: Sonar API key not configured.');
        return;
      }

      const prompt = buildAISummaryPrompt(mostRelevantFlight);

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sonarKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: 'You are an expert travel and aviation analyst producing concise, high-signal briefings for travelers.' },
            { role: 'user', content: prompt }
          ],
          web_search: true,
          max_tokens: 900,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        setAiError('Failed to fetch AI summary');
        return;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      
      // Clean and format the response
      const formatted = content
        .replace(/#{1,6}\s*/g, '') // Remove markdown headers
        .replace(/\*\*\*+/g, '') // Remove triple asterisks
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\[([\d,]+)\]/g, '') // Remove citation markers [1][2][3]
        .replace(/^- /gm, '• ') // Convert dashes to bullets
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
        .trim();
      
      setAiSummary(formatted || 'No summary available.');

      // Fetch 1-2 top aviation news items for dep/arr cities
      const quickQueries: string[] = [];
      const depInfo = getAirportInfo(mostRelevantFlight.departure.airport) || ({} as any);
      const arrInfo = getAirportInfo(mostRelevantFlight.arrival.airport) || ({} as any);
      const depCity = mostRelevantFlight.departure.airportCity || depInfo.city || mostRelevantFlight.departure.airport;
      const arrCity = mostRelevantFlight.arrival.airportCity || arrInfo.city || mostRelevantFlight.arrival.airport;
      const depCountry = mostRelevantFlight.departure.airportCountry || depInfo.country || '';
      const arrCountry = mostRelevantFlight.arrival.airportCountry || arrInfo.country || '';
      
      if (depCity) quickQueries.push(`${depCity} airport aviation breaking`);
      if (arrCity) quickQueries.push(`${arrCity} airport aviation breaking`);

      const newsBatches = await Promise.allSettled(quickQueries.slice(0,2).map(q => fetchAviationNews(q)));
      const merged: NewsArticle[] = [];
      for (const r of newsBatches) {
        if (r.status === 'fulfilled') {
          merged.push(...r.value.slice(0, 2));
        }
      }
      setAiTopNews(merged.slice(0, 2));

      // Fetch top 3 breaking news from countries using Sonar API
      const countries = new Set<string>();
      if (depCountry) countries.add(depCountry);
      if (arrCountry) countries.add(arrCountry);
      
      console.log('🌍 Countries detected:', Array.from(countries));
      
      const breakingMerged: NewsArticle[] = [];
      
      if (sonarKey && countries.size > 0) {
        const countryArray = Array.from(countries);
        
        for (const country of countryArray.slice(0, 2)) {
          try {
            const breakingPrompt = `Provide the top 3 breaking news headlines from ${country} today. Focus on major national news, politics, economy, or significant events that would be relevant to travelers.

Format each as:
Title: [headline]
Source: [news source]
Date: [today's date]
URL: [article URL if available, otherwise use "#"]

Keep it concise - only the 3 most important current headlines.`;

            const breakingResponse = await fetch('https://api.perplexity.ai/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sonarKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                model: 'sonar',
                messages: [
                  { role: 'system', content: 'You are a news aggregator providing concise, factual breaking news headlines.' },
                  { role: 'user', content: breakingPrompt }
                ],
                web_search: true,
                max_tokens: 400,
                temperature: 0.1
              })
            });

            if (breakingResponse.ok) {
              const breakingData = await breakingResponse.json();
              const breakingContent = breakingData?.choices?.[0]?.message?.content || '';
              
              // Parse the structured response
              const headlines = breakingContent.split(/\n\n+/).filter((block: string) => block.includes('Title:'));
              
              for (const headline of headlines.slice(0, 3)) {
                const titleMatch = headline.match(/Title:\s*(.+?)(?:\n|$)/);
                const sourceMatch = headline.match(/Source:\s*(.+?)(?:\n|$)/);
                const urlMatch = headline.match(/URL:\s*(.+?)(?:\n|$)/);
                
                if (titleMatch) {
                  breakingMerged.push({
                    id: `breaking-${Date.now()}-${Math.random()}`,
                    title: cleanText(titleMatch[1]),
                    description: `Breaking news from ${country}`,
                    content: `Breaking news from ${country}`,
                    url: urlMatch ? urlMatch[1].trim() : '#',
                    publishedAt: new Date().toISOString(),
                    source: {
                      id: null,
                      name: sourceMatch ? cleanText(sourceMatch[1]) : 'News Source'
                    },
                    relevance: 'high' as const,
                    category: 'Breaking'
                  });
                }
              }
            }
          } catch (err) {
            console.error(`Failed to fetch breaking news for ${country}:`, err);
          }
        }
      }
      
      // Deduplicate and take top 3
      const uniqueBreaking = breakingMerged
        .filter((item, index, self) => 
          item.title && index === self.findIndex(t => t.title === item.title)
        )
        .slice(0, 3);
      
      setBreakingNews(uniqueBreaking);
      
      // Debug logging
      console.log('🔴 Breaking news fetched:', uniqueBreaking.length, 'articles');
      console.log('🔴 Breaking news data:', uniqueBreaking);
    } catch (err) {
      console.error('❌ AI Summary fetch error:', err);
      setAiError('Failed to load AI summary');
    } finally {
      setAiLoading(false);
    }
  }, [savedFlights, loadSavedFlights, getMostRelevantFlight, buildAISummaryPrompt]);

  // Refresh news every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      
      autoFetchNews();
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [autoFetchNews, CACHE_DURATION]);

  const searchPerplexity = async (query: string): Promise<PerplexityResult[]> => {
    try {
      // Use Appwrite function for Perplexity Search API
      const functionId = import.meta.env.VITE_APPWRITE_FUNCTION_PERPLEXITY_SEARCH;
      
      if (!functionId) {
        return [];
      }

      // Use Appwrite client instead of direct fetch
      const { functions } = await import('../../lib/appwrite');
      
      const execution = await functions.createExecution(
        functionId,
        JSON.stringify({
          query: query,
          // Try to get more results (API may still limit)
          max_results: 5,
          max_tokens_per_page: 1024,
          recency_days: NEWS_RECENCY_DAYS, // Only get news from this week (last 7 days)
          include_social: false // Exclude social media to focus on news websites
        })
      );

      if (!execution.responseBody) {
        return [];
      }
      
      // Parse the function response
      let data;
      try {
        data = typeof execution.responseBody === 'string' 
          ? JSON.parse(execution.responseBody) 
          : execution.responseBody;
      } catch (e) {
        return [];
      }

      //
      
      if (!data?.success || !Array.isArray(data.results) || data.results.length === 0) {
        //
        return [];
      }

      // Convert Search API results to our format
      const mappedResults = data.results.slice(0, 5).map((result: any, index: number) => {
        // Extract source name from URL
        let sourceName = 'Web Source';
        try {
          const urlObj = new URL(result.url);
          const hostname = urlObj.hostname.replace('www.', '');
          const domainParts = hostname.split('.');
          let domain = domainParts[0];
          
          // Map to proper source names
          if (domain === 'ndtv') sourceName = 'NDTV';
          else if (domain === 'hindustantimes') sourceName = 'Hindustan Times';
          else if (domain === 'timesofindia') sourceName = 'Times of India';
          else if (domain === 'indianexpress') sourceName = 'Indian Express';
          else if (domain === 'cnbctv18') sourceName = 'CNBC TV18';
          else if (domain === 'economictimes') sourceName = 'Economic Times';
          else if (domain === 'indiatoday') sourceName = 'India Today';
          else if (domain === 'newindianexpress') sourceName = 'New Indian Express';
          else if (domain === 'mathrubhumi') sourceName = 'Mathrubhumi';
          else if (domain === 'newdelhiairport') sourceName = 'Delhi Airport';
          else sourceName = domain.charAt(0).toUpperCase() + domain.slice(1);
        } catch (e) {
          // Keep default source name
        }

              // Parse and validate date - only accept this week's news
              let publishedDate = new Date().toISOString();
              try {
                const dateStr = result.date || result.publishedAt || result.last_updated || result.timestamp;
                if (dateStr) {
                  // Handle different date formats
                  let parsedDate;
                  if (dateStr.includes('T')) {
                    // ISO format with time
                    parsedDate = new Date(dateStr);
                  } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // YYYY-MM-DD format
                    parsedDate = new Date(dateStr + 'T00:00:00.000Z');
                  } else {
                    // Try parsing as is
                    parsedDate = new Date(dateStr);
                  }
                  
                  const now = new Date();
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(now.getDate() - NEWS_RECENCY_DAYS);
                  
                  //
                  
                  // Only accept dates from this week (last 7 days)
                  if (parsedDate >= oneWeekAgo && parsedDate <= now) {
                    publishedDate = parsedDate.toISOString();
                  } else {
                    // If date is too old or in future, skip this result
                    return null;
                  }
                } else {
                  // If no date provided, use current date but still include the result
                    publishedDate = new Date().toISOString();
                }
              } catch (e) {
                //
                // Use current date for results with invalid dates
                publishedDate = new Date().toISOString();
              }

              // Map result following recommended schema
              const mappedResult = {
          id: `search-${index}-${Date.now()}-${Math.random()}`,
                title: result.title || result.headline || 'Aviation News',
                content: result.snippet || result.content || result.description || 'Click to read full article',
                url: result.url || result.link || '#',
                publishedAt: publishedDate,
          source: sourceName,
                relevance: index === 0 ? 'high' : index < 2 ? 'medium' : 'low',
                // Add citation info
                domain: result.url ? new URL(result.url).hostname.replace('www.', '') : 'Unknown',
                // Add type for UI differentiation
                type: 'ai'
              };
        
        //
        return mappedResult;
      });
      
      //
      return mappedResults;
    } catch (err) {
      //
      return [];
    }
  };

  const fetchAviationNews = async (searchTerm: string): Promise<NewsArticle[]> => {
    try {
      const apiKey = import.meta.env.VITE_NEWS_API_KEY;
      if (!apiKey) {
        
        return [];
      }

      
      
      // Test API connectivity first
      try {
        const testResponse = await fetch(`https://newsapi.org/v2/sources?apiKey=${apiKey}`);
        if (testResponse.ok) {
          
        } else {
          
        }
      } catch (err) {
        
      }

      // Build user-specific search query - simplified for better results
      const searchQuery = searchTerm; // Simplified query for better NewsAPI results

      // Calculate date 7 days ago for recency filter (this week only)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - NEWS_RECENCY_DAYS);
      const fromDate = oneWeekAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      //

      // Multiple news source searches in parallel
      const newsPromises = [];
      
      // 1. International news sources with advanced parameters
      newsPromises.push(
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&sources=reuters,bloomberg,cnn,bbc-news,associated-press,google-news&language=en&sortBy=relevancy&pageSize=5&from=${fromDate}&searchIn=title,description,content&apiKey=${apiKey}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
          })
          .then(data => ({ source: 'international', data }))
          .catch(() => ({ source: 'international', data: { status: 'error', articles: [] } }))
      );
      
      // 2. Indian news sources with advanced parameters
      newsPromises.push(
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&sources=hindustan-times,the-times-of-india,the-indian-express,ndtv,cnbc-tv18,economic-times,india-today&language=en&sortBy=relevancy&pageSize=5&from=${fromDate}&searchIn=title,description,content&apiKey=${apiKey}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
          })
          .then(data => ({ source: 'indian', data }))
          .catch(() => ({ source: 'indian', data: { status: 'error', articles: [] } }))
      );
      
      // 3. Aviation-specific domains with advanced parameters
      newsPromises.push(
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&domains=flightglobal.com,aviationweek.com,airlineratings.com,simpleflying.com,airport-technology.com,aviationtoday.com&language=en&sortBy=relevancy&pageSize=5&from=${fromDate}&searchIn=title,description,content&apiKey=${apiKey}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
          })
          .then(data => ({ source: 'aviation', data }))
          .catch(() => ({ source: 'aviation', data: { status: 'error', articles: [] } }))
      );

      // 4. General aviation news with broader search and exclusions
      newsPromises.push(
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}+aviation+flight&language=en&sortBy=relevancy&pageSize=5&from=${fromDate}&searchIn=title,description,content&excludeDomains=flightradar24.com,flightaware.com,flightstats.com&apiKey=${apiKey}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
          })
          .then(data => ({ source: 'general', data }))
          .catch(() => ({ source: 'general', data: { status: 'error', articles: [] } }))
      );

      // Execute all searches in parallel
      const allNewsResults = await Promise.allSettled(newsPromises);
      
      // Combine all results
      const allArticles = [];
      for (const result of allNewsResults) {
        if (result.status === 'fulfilled' && result.value.data.status === 'ok') {
          
          allArticles.push(...result.value.data.articles);
        } else if (result.status === 'fulfilled') {
          
        } else {
          
        }
      }
      
      

      // If no articles found, try a simpler search without date restrictions
      if (allArticles.length === 0) {
        
        try {
          const fallbackResponse = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.status === 'ok' && fallbackData.articles.length > 0) {
              
              allArticles.push(...fallbackData.articles);
            }
          }
        } catch (err) {
          
        }
      }

      // Domain blacklist to exclude commercial/tracker sources
      const blockedDomains = [
        'flightradar24.com','flightaware.com','tripadvisor.com','expedia.com','skyscanner.com','kayak.com','makemytrip.com','cheapflights.com','booking.com',
        'trip.com','ixigo.com','adanione.com','flightstats.com','myflightradar24.com','flighty.com','flightstatus.com','flightmonitor.com',
        'liveflight.com','flightdetails.com','flightinformation.com','flighttracker.com','flightdata.com','flightapp.com'
      ];

      

      // Process and filter articles
      const processedArticles: NewsArticle[] = allArticles
        .filter((article: any) => {
          if (!article.title || !article.description || !article.url) {
            
            return false;
          }
          
          try {
            const host = new URL(article.url).hostname.replace('www.','');
            if (blockedDomains.some(d => host.includes(d))) {
              
              return false;
            }
          } catch {}
          
          const content = (article.title + ' ' + article.description).toLowerCase();
          const term = searchTerm.toLowerCase();
          
          // Must be aviation-related - expanded keywords
          const aviationKeywords = [
            'airline', 'aviation', 'flight', 'aircraft', 'airport', 'airways', 'airplane', 'plane',
            'indigo', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune',
            'air india', 'spicejet', 'vistara', 'goair', 'jet airways', 'kingfisher',
            'departure', 'arrival', 'terminal', 'runway', 'air traffic', 'pilot', 'crew',
            'delay', 'cancelled', 'cancellation', 'strike', 'weather', 'fog', 'visibility'
          ];
          const hasAviationKeywords = aviationKeywords.some(keyword => content.includes(keyword));
          
          // More flexible search term matching
          const searchTerms = term.split(' ').filter(t => t.length > 2); // Remove short words
          const hasSearchTerm = searchTerms.some(searchTerm => 
            content.includes(searchTerm) || 
            content.includes(searchTerm.replace(/\s+/g, ''))
          );
          
          // For articles with aviation keywords, be more lenient with search terms
          if (hasAviationKeywords && !hasSearchTerm) {
            // Check if it's a general aviation/airport article
            const generalAviationTerms = ['airport', 'aviation', 'flight', 'airline'];
            const hasGeneralAviation = generalAviationTerms.some(keyword => content.includes(keyword));
            if (hasGeneralAviation) {
              
              return true;
            }
          }
          
          if (!hasAviationKeywords) {
            
            return false;
          }
          
          if (!hasSearchTerm) {
            
            return false;
          }
          
          
          return true;
        })
        .map((article: any, index: number) => ({
          id: `news-${index}-${Date.now()}`,
          title: cleanText(article.title),
          description: cleanText(article.description),
          content: article.content,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source,
          relevance: getRelevanceScore(article.title + ' ' + article.description, searchTerm),
          category: categorizeNews(article.title + ' ' + article.description)
        }));


      return processedArticles;
    } catch (err) {
      return [];
    }
  };

  const cleanText = (text: string): string => {
    if (!text) return '';
    
    return text
      // Remove markdown-style formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#+\s*/gm, '')
      
      // Remove citation markers like [1], [2], etc.
      .replace(/\[\d+\]/g, '')
      
      // Aggressively remove ALL forms of AI response intros
      .replace(/^Here are.*?:/gi, '')
      .replace(/^The following.*?:/gi, '')
      .replace(/^Below are.*?:/gi, '')
      .replace(/^These are.*?:/gi, '')
      .replace(/^Based on.*?:/gi, '')
      .replace(/^According to.*?:/gi, '')
      .replace(/^As of.*?:/gi, '')
      .replace(/^.*?Here are.*?:/gi, '')
      .replace(/^.*?The following.*?:/gi, '')
      .replace(/^.*?updates.*?:/gi, '')
      .replace(/^.*?information.*?:/gi, '')
      .replace(/^.*?news.*?:/gi, '')
      .replace(/^.*?latest.*?:/gi, '')
      
      // Clean up excessive punctuation and formatting
      .replace(/\*{2,}/g, '')
      .replace(/-{3,}/g, '')
      .replace(/={3,}/g, '')
      .replace(/HEADLINE:\s*/gi, '')
      .replace(/DESCRIPTION:\s*/gi, '')
      
      // Remove excessive whitespace and normalize line breaks
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  const getRelevanceScore = (text: string, _query?: string): 'high' | 'medium' | 'low' => {
    const highRelevanceKeywords = ['delay', 'cancel', 'emergency', 'incident', 'strike', 'grounded'];
    const mediumRelevanceKeywords = ['update', 'change', 'new', 'announcement', 'service', 'route'];
    
    const lowerText = text.toLowerCase();
    
    if (highRelevanceKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'high';
    }
    
    if (mediumRelevanceKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  };

  const categorizeNews = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('delay') || lowerText.includes('cancel') || lowerText.includes('schedule')) {
      return 'Operations';
    } else if (lowerText.includes('safety') || lowerText.includes('incident') || lowerText.includes('emergency')) {
      return 'Safety';
    } else if (lowerText.includes('route') || lowerText.includes('destination') || lowerText.includes('service')) {
      return 'Routes & Services';
    }
    
    return 'General';
  };



  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    }
  };

  const handleRefresh = () => {
    autoFetchNews(true);
  };

  return (
    <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Tabs */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab('latest')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'latest'
                  ? 'bg-sky-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Latest News
            </button>
            <button
              onClick={() => {
                setActiveTab('ai-summary');
                if (!aiSummary && !aiLoading) fetchAISummary();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'ai-summary'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Brain className="h-4 w-4" /> AI Summarized
            </button>
          </div>
          
          {/* Flight Sources Info */}
          {newsSources.length > 0 && (
            <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monitoring latest relevant flight
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {newsSources.slice(0, 6).map((source, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    {source}
                  </span>
                ))}
                {newsSources.length > 6 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    +{newsSources.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 shadow-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error fetching news</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Summarized Tab */}
        {activeTab === 'ai-summary' ? (
          <div className="max-w-3xl mx-auto">
            {aiLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Generating summarized briefing...</h3>
                <p className="text-gray-600 dark:text-gray-400">Scanning trusted sources and compiling a concise travel briefing</p>
              </div>
            ) : aiError ? (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{aiError}</h3>
                    <button
                      onClick={() => fetchAISummary()}
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      <RefreshCw className="h-4 w-4" /> Try Again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" /> AI Summarized Briefing
                  </h2>
                  <button
                    onClick={() => fetchAISummary()}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh Summary
                  </button>
                </div>
                <div className="space-y-6">
                  {/* Styled summary card */}
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 shadow-sm">
                    <div className="text-sm leading-7 text-gray-800 dark:text-gray-200 space-y-4">
                      {aiSummary.split('\n').map((line, idx) => {
                        // Check if line starts with emoji (section heading)
                        const isHeading = /^[✈️🏢🌤️🛫🛡️🌍📰🎒📊📞]/.test(line);
                        
                        if (isHeading) {
                          return (
                            <div key={idx} className="font-semibold text-base text-gray-900 dark:text-white mt-3 first:mt-0">
                              {line}
                            </div>
                          );
                        }
                        
                        // Check if line is a bullet point
                        if (line.trim().startsWith('•')) {
                          return (
                            <div key={idx} className="flex items-start gap-2 ml-4">
                              <span className="text-sky-500 mt-1">•</span>
                              <span className="flex-1 text-gray-700 dark:text-gray-300">
                                {line.replace(/^[•\s]+/, '')}
                              </span>
                            </div>
                          );
                        }
                        
                        // Regular text
                        if (line.trim()) {
                          return (
                            <div key={idx} className="text-gray-700 dark:text-gray-300">
                              {line}
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                  </div>
                  
                  {/* Quick facts grid (icons) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                      <Clock className="h-4 w-4 text-sky-500" /> Real-time updates every 15 min
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                      <Cloud className="h-4 w-4 text-sky-500" /> Weather & airport advisories monitored
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                      <Shield className="h-4 w-4 text-sky-500" /> Security & health notices checked
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                      <Luggage className="h-4 w-4 text-sky-500" /> Baggage & check-in tips included
                    </div>
                  </div>
                  {/* Breaking News Section - Always visible */}
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">!</span>
                      Top Breaking News
                    </h3>
                    {breakingNews.length > 0 ? (
                      <ul className="space-y-3">
                        {breakingNews.map((n, idx) => (
                          <li key={n.id || idx} className="flex items-start gap-3 pb-3 border-b border-red-200 dark:border-red-800 last:border-0 last:pb-0">
                            <span className="flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <a
                                href={n.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              >
                                {n.title}
                              </a>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {typeof n.source === 'string' ? n.source : n.source.name}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(n.publishedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                        {aiLoading ? 'Loading breaking news...' : 'No breaking news available at the moment.'}
                      </div>
                    )}
                  </div>

                  {/* Aviation Headlines Section */}
                  {aiTopNews.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Aviation Headlines</h3>
                      <ul className="space-y-2">
                        {aiTopNews.map((n, idx) => (
                          <li key={n.id || idx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                            <a
                              href={n.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              {n.title}
                            </a>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {new Date(n.publishedAt).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading Flight News...</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching the latest updates for your saved flights
            </p>
          </div>
        ) : combinedResults.length > 0 ? (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest Flight News ({combinedResults.length})
              </h2>
              <div className="flex items-center gap-4">
                {lastFetched && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Updated: {lastFetched.toLocaleTimeString()}
                  </p>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 transition-colors text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* News Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {combinedResults.map((result) => (
                <div key={result.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelevanceColor(result.relevance)}`}>
                          {result.relevance}
                        </span>
                        {result.type === 'ai' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                            <Globe className="h-3 w-3 mr-1" />
                            Live Search
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(result.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 leading-snug line-clamp-2">
                      {result.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
                      {'description' in result ? result.description : result.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {typeof result.source === 'string' ? result.source : (result.source as any).name}
                      </span>
                      {result.url !== '#' && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 text-sm font-medium transition-colors"
                        >
                          Read more
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : savedFlights.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Plane className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No Saved Flights Found</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Save some flights to get personalized news alerts about airlines, routes, and destinations that matter to you.
            </p>
            <a
              href="/flights"
              className="inline-flex items-center px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Search Flights
            </a>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Newspaper className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No News Available</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              No recent news found for your saved flights. Try refreshing or check back later.
            </p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh News
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightNewsAlerts;


