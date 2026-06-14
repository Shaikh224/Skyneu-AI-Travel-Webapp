/**
 * AI Trip Planning Service with Perplexity Integration
 * Provides comprehensive, research-backed travel planning
 */

import { UserPreferences } from '@/lib/appwrite';
import currencyConversionService from './currencyConversionService';
import coordinateValidationService from './coordinateValidationService';

export interface TripPlanRequest {
  userMessage: string;
  preferences: UserPreferences;
}

export interface QueryClassification {
  type: 'greeting' | 'trip_planning' | 'travel_question' | 'skyneu_service' | 'service_redirect' | 'non_travel';
  confidence: number;
  reason: string;
  service?: string; // For service_redirect type
}

class AITripPlanningService {
  private readonly baseUrl = 'https://api.perplexity.ai/chat/completions';
  private readonly maxTokens = 4500; // Reduced for cost optimization
  private readonly apiKey: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly rateLimitMs = 2000; // 2 seconds between requests

  constructor() {
    this.apiKey = import.meta.env.VITE_SONAR_API_KEY || '';
  }

  /**
   * Rate limiting to prevent exceeding API quotas
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitMs) {
      const delay = this.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
    
  }

  /**
   * Detect which service the user is asking for
   */
  private detectServiceRedirect(query: string): string | null {
    const serviceRedirects = {
      flightSearch: [
        'flight search', 'search flights', 'book flight', 'find flights', 'flight booking',
        'cheap flights', 'flight deals', 'flight prices', 'airline tickets', 'book tickets'
      ],
      visa: [
        'visa', 'visa requirements', 'visa application', 'visa process', 'visa documents',
        'visa status', 'visa check', 'visa information', 'visa help', 'visa assistance'
      ],
      flightTracking: [
        'flight tracker', 'track flight', 'flight status', 'flight delay', 'flight arrival',
        'flight departure', 'flight schedule', 'flight information', 'flight updates'
      ],
      aviationEducation: [
        'aviation education', 'learn aviation', 'aviation courses', 'pilot training',
        'aviation knowledge', 'aviation guide', 'aviation learning'
      ]
    };
    
    const lower = query.toLowerCase();
    for (const [service, keywords] of Object.entries(serviceRedirects)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return service;
      }
    }
    return null;
  }

  /**
   * Check if a query is blocked and return the category
   */
  private checkBlockedCategory(query: string): { blocked: boolean; category: string | null } {
    const BLOCKLISTS = {
      entertainment: [
        "movie", "movies", "film", "films", "series", "tv show", "shows", "episode", "drama", "cartoon", "anime",
        "netflix", "prime video", "youtube", "tiktok", "reels", "instagram", "facebook", "twitter",
        "celebrity", "actor", "actress", "singer", "music", "songs", "concert", "album", "band",
        "cricket", "football", "soccer", "tennis", "basketball", "match", "score", "live score", "IPL",
        "world cup", "fifa", "nba", "wwe", "game", "games", "gaming", "esports", "pubg", "fortnite",
        "minecraft", "roblox", "gta", "playstation", "xbox", "nintendo"
      ],
      tech: [
        "code", "coding", "programming", "algorithm", "data structure", "javascript", "react", "vue", "angular", "python",
        "java", "c++", "c#", "html", "css", "sql", "ai", "artificial intelligence", "machine learning", "deep learning",
        "neural network", "blockchain", "crypto", "cryptocurrency", "bitcoin", "ethereum", "nft", "smart contract", "web3",
        "hacking", "hack", "cybersecurity", "penetration testing", "bug bounty", "terminal", "api key", "docker", "kubernetes",
        "linux", "ubuntu", "windows error", "laptop issue", "mobile app development"
      ],
      politics: [
        "election", "elections", "vote", "voting", "president", "prime minister", "minister", "government", "politics", "political",
        "party", "parliament", "law", "policy", "war", "conflict", "protest", "riot", "strike", "religious", "religion", "god",
        "temple", "mosque", "church", "hindu", "muslim", "christian", "bible", "quran", "ramayana", "festival", "deity", "worship", "prayers",
        "sermon", "rally", "news", "breaking news", "terrorism", "terrorist", "crime", "criminal", "scam", "fraud"
      ],
      finance: [
        "stock", "stocks", "share market", "trading", "trader", "investment", "invest", "mutual fund", "loan", "personal loan",
        "credit card", "debit card", "bank", "banking", "account", "cheque", "insurance", "tax", "taxation",
        "income tax", "gst", "forex trading", "real estate", "mortgage", "property rates", "ipo", "inflation", "budget",
        "startup funding", "venture capital", "business plan"
      ],
      adult: [
        "sex", "sexual", "porn", "pornography", "nude", "nudes", "xxx", "hentai", "erotic", "blowjob", "anal", "gangbang", "fetish",
        "sex chat", "strip", "escort", "prostitution", "rape", "molest", "incest", "bdsm", "masturbation", "dick", "pussy",
        "boobs", "tits", "ass", "fuck", "fucking", "shit", "bitch", "bastard", "asshole", "slut", "whore", "cunt", "dickhead",
        "jerk", "moron", "idiot", "dumb", "hate", "kill", "murder", "suicide", "self harm", "abuse", "abusive", "racial slur",
        "slurs", "racist", "nazi", "hitler"
      ],
      misc: [
        "weather today", "daily horoscope", "zodiac", "astrology", "tarot", "personality test", "iq test",
        "riddle", "joke", "jokes", "meme", "memes", "quiz", "puzzle", "poem", "write essay", "homework", "school project",
        "recipe", "cooking", "cook", "dish", "food recipe", "fitness", "gym", "workout", "diet plan", "skincare", "fashion",
        "clothing", "makeup", "hairstyle", "education", "college admission", "exam", "syllabus", "medical diagnosis", "symptoms",
        "doctor", "treatment", "hospital", "therapy", "legal advice", "lawyer", "court case", "relationship advice", "dating",
        "love", "crush", "girlfriend", "boyfriend", "marriage counseling", "parenting", "baby care",
        "my name", "what is my name", "who am i", "tell me about myself", "personal information", "about me", "my age", "my birthday",
        "my favorite", "my hobby", "my interest", "my passion"
      ]
    };
    
    const lower = query.toLowerCase();
    for (const [category, keywords] of Object.entries(BLOCKLISTS)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return { blocked: true, category };
      }
    }
    return { blocked: false, category: null };
  }

  /**
   * Classify the user's query to determine appropriate response type
   */
  private classifyQuery(userMessage: string): QueryClassification {
    const message = userMessage.toLowerCase().trim();
    const messageLower = message; // Alias for consistency
    
    // EXPLICIT trip planning keywords (high confidence for structured trip planning)
    const explicitTripPlanningKeywords = [
      'plan a trip to', 'plan my trip', 'plan the trip', 'create a trip to', 'create trip plan',
      'trip plan', 'plan trip', 'full trip plan', 'plan full trip', 'generate trip plan',
      'travel plan', 'create itinerary', 'make itinerary', 'build itinerary', 'generate itinerary',
      'plan vacation', 'design itinerary', 
      'organize trip', 'book trip', 'make a trip', 'design trip',
      'full itinerary', 'complete itinerary', 'complete trip', 'detailed trip', 'comprehensive trip',
      'full plan', 'plan now', 'ok plan', 'okay plan', 'yes plan', 'start planning', 'create my trip',
      'help me plan', 'can you plan', 'i want to plan', 'planning a trip',
      'plan it', 'plan this', 'do it', 'go ahead', 'yes create', 'generate trip'
    ];
    
    // Implicit trip planning (destination + action words) - be more specific
    const implicitTripPlanningPatterns = [
      /plan.*trip.*to \w+/i,
      /trip\s+to\s+\w+/i,  // Added this pattern for "trip to dammam"
      /travel\s+to\s+\w+/i, // Added this pattern for "travel to dammam"
      /create.*trip.*to \w+/i,
      /organize.*trip.*to \w+/i,
      /book.*trip.*to \w+/i,
      /make.*trip.*to \w+/i,
      /design.*trip.*to \w+/i,
      /vacation.*to \w+/i,
      /holiday.*to \w+/i,
      /weekend.*in \w+/i,
      /day trip.*to \w+/i,
      /backpacking.*\w+/i,
      /road trip.*\w+/i,
      /cruise.*to \w+/i,
      /honeymoon.*to \w+/i,
      /business trip.*to \w+/i
    ];
    
    // General travel questions (should get short answers) - made more specific
    const travelQuestionKeywords = [
      'best time to visit', 'best time to travel', 'when to visit', 'when to travel',
      'visa requirements', 'visa for', 'passport requirements', 'vaccination requirements', 'travel insurance',
      'weather in', 'climate in', 'temperature in', 'what to expect weather',
      'local customs in', 'language spoken', 'what to pack for', 'time zone in', 'jet lag',
      'travel tips for', 'safety in', 'transportation in', 'airport in', 'airline to',
      'hotel in', 'accommodation in', 'restaurant in', 'food in', 'attraction in',
      'tourist attractions', 'sightseeing in', 'culture in', 'festival in', 'shopping in',
      'budget for visiting', 'cost of visiting', 'how much does it cost', 'exchange rate for', 'tipping in',
      'currency in', 'what is the currency', 'how is the weather', 'where is located', 'why visit',
      'tell me about the culture', 'information about the weather', 'facts about the country',
      'is it safe to visit', 'is it worth visiting', 'should i visit in'
    ];

    // General travel question patterns (broader matching)
    const travelQuestionPatterns = [
      /best places? to visit/i,
      /best places? to vist/i, // tolerate common typo
      /best places? to go/i,
      /best places? to see/i,
      /best places? to explore/i,
      /best destinations?/i,
      /best cities? to visit/i,
      /best countries? to visit/i,
      /best hotels? in/i,
      /best restaurants? in/i,
      /best attractions? in/i,
      /what to do in/i,
      /what to see in/i,
      /where to go in/i,
      /where to visit in/i,
      /top places? in/i,
      /must see in/i,
      /recommendations? for/i,
      /suggestions? for/i,
      /advice for visiting/i,
      /tips for visiting/i,
      /guide to/i,
      /information about/i,
      /tell me about/i,
      /what's in/i,
      /what's special about/i,
      /why visit/i,
      /is.*worth visiting/i,
      /should i go to/i,
      /is.*good for/i,
      /best time.*visit/i,
      /best time.*go to/i,
      /when.*visit/i,
      /when.*go to/i
    ];
    
    // SkyNeu/Travel service keywords (redirect to appropriate services)
    const skyNeuKeywords = [
      'flight search', 'search flights', 'book flight', 'flight status',
      'flight tracker', 'track flight', 'aviation education', 'skyneu'
    ];
    
    // Service-specific redirect patterns
    const serviceRedirects = {
      flightSearch: [
        'flight search', 'search flights', 'book flight', 'find flights', 'flight booking',
        'cheap flights', 'flight deals', 'flight prices', 'airline tickets', 'book tickets'
      ],
      visa: [
        'visa', 'visa requirements', 'visa application', 'visa process', 'visa documents',
        'visa status', 'visa check', 'visa information', 'visa help', 'visa assistance'
      ],
      flightTracking: [
        'flight tracker', 'track flight', 'flight status', 'flight delay', 'flight arrival',
        'flight departure', 'flight schedule', 'flight information', 'flight updates'
      ],
      aviationEducation: [
        'aviation education', 'learn aviation', 'aviation courses', 'pilot training',
        'aviation knowledge', 'aviation guide', 'aviation learning'
      ]
    };
    
    // Categorized blocklists for better organization and analytics
    const BLOCKLISTS = {
      // 🎭 Entertainment / Pop Culture / Sports
      entertainment: [
        "movie", "movies", "film", "films", "series", "tv show", "shows", "episode", "drama", "cartoon", "anime",
        "netflix", "prime video", "youtube", "tiktok", "reels", "instagram", "facebook", "twitter",
        "celebrity", "actor", "actress", "singer", "music", "songs", "concert", "album", "band",
        "cricket", "football", "soccer", "tennis", "basketball", "match", "score", "live score", "IPL",
        "world cup", "fifa", "nba", "wwe", "game", "games", "gaming", "esports", "pubg", "fortnite",
        "minecraft", "roblox", "gta", "playstation", "xbox", "nintendo"
      ],
      
      // 💻 Technology / Programming / Unrelated Technical Topics
      tech: [
        "code", "coding", "programming", "algorithm", "data structure", "javascript", "react", "vue", "angular", "python",
        "java", "c++", "c#", "html", "css", "sql", "ai", "artificial intelligence", "machine learning", "deep learning",
        "neural network", "blockchain", "crypto", "cryptocurrency", "bitcoin", "ethereum", "nft", "smart contract", "web3",
        "hacking", "hack", "cybersecurity", "penetration testing", "bug bounty", "terminal", "api key", "docker", "kubernetes",
        "linux", "ubuntu", "windows error", "laptop issue", "mobile app development"
      ],
      
      // 🏛 Politics / Religion / News / Controversial
      politics: [
        "election", "elections", "vote", "voting", "president", "prime minister", "minister", "government", "politics", "political",
        "party", "parliament", "law", "policy", "war", "conflict", "protest", "riot", "strike", "religious", "religion", "god",
        "temple", "mosque", "church", "hindu", "muslim", "christian", "bible", "quran", "ramayana", "festival", "deity", "worship", "prayers",
        "sermon", "rally", "news", "breaking news", "terrorism", "terrorist", "crime", "criminal", "scam", "fraud"
      ],
      
      // 💰 Finance / Business (non-travel)
      finance: [
        "stock", "stocks", "share market", "trading", "trader", "investment", "invest", "mutual fund", "loan", "personal loan",
        "credit card", "debit card", "bank", "banking", "account", "cheque", "insurance", "tax", "taxation",
        "income tax", "gst", "forex trading", "real estate", "mortgage", "property rates", "ipo", "inflation", "budget",
        "startup funding", "venture capital", "business plan"
      ],
      
      // 🚫 Adult / Explicit / Abuse Prevention (separate for moderation)
      adult: [
        "sex", "sexual", "porn", "pornography", "nude", "nudes", "xxx", "hentai", "erotic", "blowjob", "anal", "gangbang", "fetish",
        "sex chat", "strip", "escort", "prostitution", "rape", "molest", "incest", "bdsm", "masturbation", "dick", "pussy",
        "boobs", "tits", "ass", "fuck", "fucking", "shit", "bitch", "bastard", "asshole", "slut", "whore", "cunt", "dickhead",
        "jerk", "moron", "idiot", "dumb", "hate", "kill", "murder", "suicide", "self harm", "abuse", "abusive", "racial slur",
        "slurs", "racist", "nazi", "hitler"
      ],
      
      // 📝 General Non-Travel Queries / Small Talk / Miscellaneous
      misc: [
        "weather today", "daily horoscope", "zodiac", "astrology", "tarot", "personality test", "iq test",
        "riddle", "joke", "jokes", "meme", "memes", "quiz", "puzzle", "poem", "write essay", "homework", "school project",
        "recipe", "cooking", "cook", "dish", "food recipe", "fitness", "gym", "workout", "diet plan", "skincare", "fashion",
        "clothing", "makeup", "hairstyle", "education", "college admission", "exam", "syllabus", "medical diagnosis", "symptoms",
        "doctor", "treatment", "hospital", "therapy", "legal advice", "lawyer", "court case", "relationship advice", "dating",
        "love", "crush", "girlfriend", "boyfriend", "marriage counseling", "parenting", "baby care",
        "my name", "what is my name", "who am i", "tell me about myself", "personal information", "about me", "my age", "my birthday",
        "my favorite", "my hobby", "my interest", "my passion"
      ]
    };
    
    // Function to check if query is blocked and return category
    const isBlockedQuery = (query: string) => {
      const lower = query.toLowerCase();
      for (const [category, keywords] of Object.entries(BLOCKLISTS)) {
        if (keywords.some(keyword => lower.includes(keyword))) {
          return { blocked: true, category };
        }
      }
      return { blocked: false, category: null };
    };
    
    // Check for blocked content
    const blockResult = isBlockedQuery(message);
    
    // Travel-related keywords for exception checking
    const travelRelatedKeywords = [
      'visa', 'passport', 'travel', 'trip', 'tour', 'destination', 'hotel', 'flight', 
      'airline', 'airport', 'country', 'city', 'weather in', 'climate in', 'visit',
      'vacation', 'holiday', 'booking', 'itinerary', 'attractions', 'things to do',
      'requirements', 'pack', 'luggage', 'suitcase', 'backpack', 'guide', 'blogger',
      'vlogger', 'explorer', 'navigator', 'tourist', 'traveler', 'accommodation',
      'hostel', 'resort', 'cruise', 'train', 'bus', 'journey', 'adventure'
    ];
    
    // Check if message contains any travel-related keywords
    const hasTravelKeyword = travelRelatedKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    // Non-travel patterns (mathematical, general knowledge, entertainment)
    const nonTravelPatterns = [
      // Math patterns
      /^\d+\s*[\+\-\*\/\%]\s*\d+/, // Math expressions like "2+2", "5*3"
      /^what is \d+/, // Math questions like "what is 2+2"
      /^how much is \d+/, // Math questions
      /^calculate/i, // Calculator requests
      /^solve/i, // Solve equations
      
      // General knowledge patterns
      /^define/i, // Definitions
      /^translate/i, // Translation requests
      /^what's.*(?:score|result|winner)/i, // Sports scores
      /^(?:latest|current|today's).*(?:news|update)/i, // News requests
      
      // Personal questions
      /^(?:my name|what is my name|who am i|tell me about myself)$/i,
      /^(?:my age|my birthday|my favorite|my hobby|my interest|my passion)$/i,
      
      // Short queries (likely non-travel)
      /^(?:thanks|thank you|bye|goodbye|see you)$/i,
      /^(?:yes|no|ok|okay|sure|maybe|perhaps)$/i,
      
      // Food/cooking patterns
      /^(?:best recipe|how to cook|cooking recipe|food recipe)/i,
      /^(?:ingredients|cooking tips|kitchen|chef)/i,
      
      // Entertainment patterns
      /^(?:ea sports|fifa|football game|soccer game|video game)/i,
      /^(?:gaming tips|game review|playstation|xbox|nintendo)/i,
      
      // Inappropriate content patterns
      /(?:fuck|shit|bitch|bastard|asshole|slut|whore|cunt|dickhead|jerk|moron|idiot)/i,
      /(?:sex|sexual|porn|nude|xxx|hentai|erotic)/i,
      /(?:kill|murder|suicide|hate|abuse|racist|nazi)/i,
      
      // Technology patterns
      /^(?:code|coding|programming|algorithm|javascript|python|java|html|css)/i,
      /^(?:hack|hacking|cybersecurity|terminal|docker|kubernetes)/i,
      /^(?:crypto|bitcoin|ethereum|blockchain|nft|web3)/i,
      
      // Finance patterns
      /^(?:stock|trading|investment|loan|bank|insurance|tax)/i,
      /^(?:real estate|mortgage|property|ipo|inflation)/i,
      
      // Health/Medical patterns
      /^(?:medical|doctor|treatment|hospital|therapy|diagnosis|symptoms)/i,
      /^(?:fitness|gym|workout|diet|skincare)/i,
      
      // Education patterns
      /^(?:homework|school project|exam|syllabus|college admission)/i,
      /^(?:essay|poem|quiz|puzzle|riddle|joke)/i,
      
      // General knowledge patterns (only if no travel context)
      /^(?:tell me about|explain to me|teach me about).*(?!.*(?:travel|visit|trip|tour|destination|hotel|country|city|weather in|climate in))/i,
      
      // Semantic blocking for clever phrasing
      /(?:tell me a|share a|give me a).*(?:joke|story|riddle|poem|meme)/i,
      /(?:what's|what is).*(?:your|the).*(?:favorite|best|worst)/i,
      /(?:how do you|can you).*(?:feel|think|like|hate)/i,
      /(?:what do you|do you).*(?:think about|know about|like about)/i,
      /(?:who are you|what are you|describe yourself)/i,
      /(?:help me with|assist me with|guide me through).*(?!.*(?:travel|trip|visit|destination|hotel|flight))/i
    ];
    
    // Check if message might be asking about a place (proper noun capitalized)
    const looksLikePlace = /(?:about|in|to|visit|go to)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/.test(message);
    
    // Check for greetings FIRST (highest priority for polite responses)
    const greetingPatterns = [
      /^(?:hi|hello|hey|good morning|good afternoon|good evening|good night)$/i,
      /^(?:hi there|hello there|hey there)$/i,
      /^(?:greetings|salutations)$/i
    ];
    
    const isGreeting = greetingPatterns.some(pattern => pattern.test(message));
    if (isGreeting) {
      return {
        type: 'greeting',
        confidence: 0.95,
        reason: 'Greeting detected'
      };
    }
    
    // Check for very short queries (likely non-travel unless they contain travel keywords)
    const isVeryShort = message.length <= 15 && !hasTravelKeyword;
    
    // General knowledge patterns (only block if NO travel keywords present AND doesn't look like a place)
    const generalKnowledgePatterns = (!hasTravelKeyword && !looksLikePlace) ? [
      /^who is/i,
      /^who was/i,
      /^what is/i,
      /^what are/i,
      /^what does.*mean/i,
      /^how to\s+(?!travel|pack|book|plan|visit|get to|go to|reach)/i,
      /^tell me about/i
    ] : [];
    
    // Check for explicit trip planning requests FIRST (highest priority)
    const hasExplicitTripPlanning = explicitTripPlanningKeywords.some(keyword => message.includes(keyword));

    // Additional command-style triggers (e.g., "trip plan", "plan it", "create itinerary")
    const hasTripPlanCommand = (
      /\bplan\b.{0,3}\btrip\b/i.test(message) || // plan ... trip within 3 chars
      /\btrip\b.{0,3}\bplan\b/i.test(message) ||
      /\b(plan|make|create|build|generate|design)\b.{0,10}\bitinerary\b/i.test(message) ||
      /\b(plan|start|begin|do)\b.{0,5}\b(it|this)\b/i.test(message)
    );
    if (hasExplicitTripPlanning || hasTripPlanCommand) {
      return {
        type: 'trip_planning',
        confidence: 0.95,
        reason: 'Explicit trip planning command detected'
      };
    }
    
    // Check for implicit trip planning patterns (high priority)
    const hasImplicitTripPlanning = implicitTripPlanningPatterns.some(pattern => pattern.test(message))
      || /plan.*full.*trip/i.test(message) || /full.*trip.*plan/i.test(message)
      || /generate.*trip.*plan/i.test(message);
    if (hasImplicitTripPlanning) {
      return {
        type: 'trip_planning',
        confidence: 0.9,
        reason: 'Implicit trip planning pattern detected'
      };
    }
    
    // Check for vague "plan" requests without details (e.g., "plan", "help me plan")
    const isVaguePlanRequest = /^(plan|planning|help.*plan|can.*plan|want.*plan)$/i.test(message.trim());
    if (isVaguePlanRequest) {
      return {
        type: 'trip_planning',
        confidence: 0.9,
        reason: 'Vague planning request - initiate planning flow and collect missing details'
      };
    }
    
    // Check for general travel questions (lower priority - only for specific questions)
    const hasTravelQuestions = travelQuestionKeywords.some(keyword => message.includes(keyword));
    const hasTravelPatterns = travelQuestionPatterns.some(pattern => pattern.test(message));
    
    if ((hasTravelQuestions || hasTravelPatterns) && !message.includes('plan') && !message.includes('trip')) {
      return {
        type: 'travel_question',
        confidence: 0.8,
        reason: 'General travel question - will provide direct answer'
      };
    }
    
    // Check for specific service redirects
    const detectServiceRedirect = (query: string) => {
      const lower = query.toLowerCase();
      for (const [service, keywords] of Object.entries(serviceRedirects)) {
        if (keywords.some(keyword => lower.includes(keyword))) {
          return service;
        }
      }
      return null;
    };
    
    const requestedService = detectServiceRedirect(message);
    if (requestedService) {
      return {
        type: 'service_redirect',
        confidence: 0.9,
        reason: `Redirect to ${requestedService} service`,
        service: requestedService
      };
    }
    
    // Check for general SkyNeu service requests
    const hasSkyNeuKeywords = skyNeuKeywords.some(keyword => message.includes(keyword));
    if (hasSkyNeuKeywords) {
      return {
        type: 'skyneu_service',
        confidence: 0.7,
        reason: 'Contains SkyNeu service keywords'
      };
    }
    
    // Check for blocked content using categorized approach
    if (blockResult.blocked) {
      return {
        type: 'non_travel',
        confidence: 0.95,
        reason: `Blocked in ${blockResult.category} category`
      };
    }
    
    // Additional pattern-based blocking
    const hasNonTravelPatterns = nonTravelPatterns.some(pattern => pattern.test(message));
    const hasGeneralKnowledgePattern = generalKnowledgePatterns.some(pattern => pattern.test(message));
    
    // Block very short queries unless they contain travel keywords
    if (isVeryShort) {
      return {
        type: 'non_travel',
        confidence: 0.9,
        reason: 'Very short query without travel context'
      };
    }
    
    // Block queries that are too long (potential spam/abuse)
    if (message.length > 500) {
      return {
        type: 'non_travel',
        confidence: 0.95,
        reason: 'Query too long - potential spam'
      };
    }
    
    // Block queries with excessive repetition (potential spam)
    const words = message.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 10 && uniqueWords.size < words.length * 0.3) {
      return {
        type: 'non_travel',
        confidence: 0.9,
        reason: 'Excessive repetition detected'
      };
    }
    
    if (hasNonTravelPatterns || hasGeneralKnowledgePattern) {
      return {
        type: 'non_travel',
        confidence: 0.95,
        reason: hasNonTravelPatterns ? 'Non-travel pattern detected' : 'General knowledge query without travel context'
      };
    }
    
    // For ambiguous queries, be more conservative
    // Only classify as trip planning if it has clear trip planning intent
    const hasTripIntent = /\b(?:plan|create|organize|book|make|design|help.*plan|can.*plan|want.*plan)\b/i.test(message);
    const hasDestination = /\b(?:to|in|visit|travel|go)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/.test(message);
    
    if (hasTripIntent && hasDestination) {
      return {
        type: 'trip_planning',
        confidence: 0.6,
        reason: 'Has trip planning intent with destination'
      };
    }
    
    // Default to travel question for ambiguous queries
    return {
      type: 'travel_question',
      confidence: 0.4,
      reason: 'Ambiguous query - defaulting to travel question'
    };
  }

  /**
   * Create an optimized prompt for Perplexity API with coordinate extraction
   */
  private createOptimizedPrompt(request: TripPlanRequest, conversationState?: {
    destination?: string;
    dates?: string;
    travelers?: string;
    duration?: string;
    hasAllDetails: boolean;
  }): string {
    const { userMessage, preferences } = request;
    
    // Detect transportation type for the destination
    const transportInfo = this.detectTransportationType(
      conversationState?.destination || '', 
      preferences.homeAirport
    );
    
    return `Create a comprehensive trip plan based on this request: "${userMessage}"

${conversationState && conversationState.hasAllDetails ? `
EXTRACTED TRIP DETAILS (USE THESE EXACT VALUES):
- Destination: ${conversationState.destination || 'Not specified'}
- Travel Dates: ${conversationState.dates || 'Not specified'}
- Number of Travelers: ${conversationState.travelers || 'Not specified'}
- Duration: ${conversationState.duration || 'Not specified'}

TRANSPORTATION ANALYSIS:
- Is Local/Domestic: ${transportInfo.isLocal ? 'Yes' : 'No'}
- Recommended Transport: ${transportInfo.recommendation}
- Available Options: ${transportInfo.transportTypes.join(', ')}

CRITICAL: Use these EXACT values in your response. Do NOT ask for these details again.
` : ''}

User Profile (APPLY TO ALL TRAVELERS):
- Budget Range: ${preferences.budgetRange || 'Mid-range'}
- Home Airport: ${preferences.homeAirport || 'Not specified'}
- Travel Style: ${preferences.travelStyle || 'Balanced'}
- Passport/Location: ${preferences.location || 'Not specified'}
- Travel Class: ${preferences.travelClass || 'economy'}
- Preferred Currency: ${preferences.defaultCurrency || 'USD'}
- Interests: ${Array.isArray(preferences.interests) ? preferences.interests.join(', ') : (preferences.interests || 'General tourism')}

IMPORTANT PERSONALIZATION RULES:
1. ALL costs must be in ${preferences.defaultCurrency || 'USD'} - convert if necessary
2. Apply user's travel style (${preferences.travelStyle || 'Balanced'}) to ALL recommendations
3. Apply user's budget range (${preferences.budgetRange || 'Mid-range'}) to hotels, activities, restaurants
4. Consider user's interests (${Array.isArray(preferences.interests) ? preferences.interests.join(', ') : (preferences.interests || 'General tourism')}) for activities
5. Use ${preferences.travelClass || 'economy'} class for flights
6. All travelers share the same preferences and budget allocation

CONVERSATIONAL APPROACH:
- If the user only provides a destination (like "plan a trip to Riyadh"), respond with a friendly message asking for missing details
- Be conversational and helpful, not robotic
- Ask specific questions about dates, travelers, duration, and budget
- Make the user feel like they're talking to a knowledgeable travel expert

CRITICAL TRIP DETAILS EXTRACTION:
1. TRAVEL DATES - Be smart about dates:
   - If user specifies dates (e.g., "December 15-20", "next month", "in summer"): use those dates
   - If user says "let AI decide" or doesn't specify: suggest optimal dates based on best time to visit
   - Always include both "startDate" (YYYY-MM-DD) and "endDate" (YYYY-MM-DD) in response
   - Consider current date: ${new Date().toISOString().split('T')[0]}
   - Suggest dates at least 2 weeks in the future for planning time
   - Factor in weather, festivals, peak/off-season pricing

2. NUMBER OF TRAVELERS - Intelligent extraction:
   - Look for explicit numbers: "2 people", "family of 4", "group of 6", "2", "4", etc.
   - Context clues: "solo" (1), "couple" or "we" (2), "family" (3-4), "friends" (4-6)
   - If ambiguous or not mentioned: default to 1 traveler
   - Always include "travelers" and "numberOfTravelers" fields with same NUMERIC value
   - CRITICAL: Both "travelers" and "numberOfTravelers" must be numbers (e.g., 2, not "2 people")
   - Adjust accommodation and activity recommendations based on group size
   - All cost calculations must multiply by the number of travelers
   - HOTEL PRICING: Calculate per room, not per person. For 2 people = 1 room, 3-4 people = 2 rooms, 5-6 people = 3 rooms, etc.

3. INTERACTIVE QUESTIONING - ALWAYS ask for missing details:
   - If no dates specified: "I'd love to help you plan your trip to [destination]! When would you like to travel? I can suggest the best time to visit or you can tell me your preferred dates."
   - If no travelers specified: "How many people will be traveling? (solo, couple, family, group, etc.)"
   - If budget unclear: "What's your approximate budget range for this trip?"
   - If duration unclear: "How many days would you like to spend in [destination]?"
   - If destination only: "Great choice! To create your perfect trip to [destination], I need a few details: When would you like to travel, how many people, and how many days?"

4. CONVERSATIONAL APPROACH:
   - Be friendly and helpful in your responses
   - Ask follow-up questions when information is missing
   - Suggest alternatives and ask for preferences
   - Make the user feel like they're talking to a knowledgeable travel expert

5. SMART CONTEXTUAL UNDERSTANDING:
   - "I want to go to Paris" → Ask: Would you prefer dates during the best season (April-June) or have specific dates?
   - "Plan a family trip to Tokyo" → Detect "family" = 3-4 travelers, suggest child-friendly activities
   - "Romantic getaway to Maldives" → Detect couple = 2 travelers, suggest romantic experiences
   - "Solo backpacking through Europe" → Detect solo = 1 traveler, budget-friendly hostels

6. INCLUDE IN EVERY RESPONSE:
   - "startDate": "YYYY-MM-DD"
   - "endDate": "YYYY-MM-DD" 
   - "travelers": number (e.g., 2, not "2 people")
   - "numberOfTravelers": number (same as travelers, e.g., 2)

TRANSPORTATION REQUIREMENTS:
1. TRANSPORTATION TYPE: Based on destination analysis, show appropriate transport options:
   - LOCAL/DOMESTIC destinations: Include train, bus, and flight options
   - INTERNATIONAL destinations: Focus on flight options only
   - VERY CLOSE destinations: Include bus, train, and car options
2. TRANSPORTATION DETAILS: For each transport option, include:
   - Real operator names (e.g., "Indian Railways", "Greyhound", "Amtrak")
   - Real route information and schedules
   - Current pricing and booking information
   - Duration and comfort level
   - Booking websites and contact information
3. TRANSPORTATION PRIORITY: Order options by:
   - Most practical for the distance
   - Best value for money
   - User's travel style and budget
   - Environmental impact (trains/buses preferred for domestic)

CRITICAL REQUIREMENTS:
1. For EVERY location mentioned (destinations, hotels, attractions, restaurants), include EXACT coordinates (latitude, longitude)
2. Use specific, well-known location names that can be easily mapped
3. Ensure all activities have precise location names, not vague descriptions
4. Include full addresses where possible
5. If places were validated above, use those exact coordinates

PRICING ACCURACY REQUIREMENTS:
6. Research and provide REAL, CURRENT prices from actual airlines, hotels, and services
7. Include specific airline names, flight numbers, hotel names, and restaurant names
8. Base all prices on current market rates and availability
9. Include comprehensive budget breakdown with REAL-TIME, CURRENT costs (not estimates)
10. ALL COSTS MUST BE IN THE USER'S PREFERRED CURRENCY: ${preferences.defaultCurrency || 'USD'}
11. Use the correct currency symbol and format for the preferred currency
12. Provide booking references, websites, or contact information where applicable
13. Ensure all prices reflect real-world availability and current rates
14. Research current travel market conditions for accurate pricing
15. Provide accurate, up-to-date pricing information from reliable sources
16. Include specific hotel names, restaurant names, and attraction names with real addresses
17. Ensure all coordinates are valid and can be plotted on maps
18. Use current exchange rates and local pricing for accurate cost estimates

CRITICAL PRICING RESEARCH:
- Research actual airline websites for current flight prices
- Check real hotel booking sites for current accommodation rates
- Look up current restaurant and activity prices
- Use real booking platforms like Booking.com, Expedia, Kayak, etc.
- CRITICAL: ALL PRICES MUST BE IN USER'S PREFERRED CURRENCY: ${preferences.defaultCurrency || 'USD'}
- Convert all prices to ${preferences.defaultCurrency || 'USD'} using current exchange rates
- Use proper currency symbols and formatting for ${preferences.defaultCurrency || 'USD'}

FLIGHT DETAILS ACCURACY:
- Use REAL airline names (Air India, Emirates, Qatar Airways, etc.)
- Use REAL flight numbers (format: AI123, EK456, QR789)
- Use REAL routes (actual city pairs that exist)
- Use REAL aircraft types (Boeing 737, Airbus A320, etc.)
- Use REAL booking URLs from official airline websites
- NEVER make up flight numbers or routes that don't exist
- Verify all flight details against actual airline schedules
- Include specific booking URLs and references where possible

PRICING CALCULATION ACCURACY:
- CRITICAL: Ensure total price calculations are mathematically correct
- CRITICAL: Hotel totalPrice MUST equal pricePerNight × number of nights × number of rooms needed
- CRITICAL: If hotel price is per person, multiply by number of travelers in totalPrice
- CRITICAL: Flight totalFlightCost MUST equal (outbound price + return price) × number of travelers
- CRITICAL: All prices must be reasonable (hotels < ₹100,000 total, flights < ₹50,000 per person)
- CRITICAL: All prices must be REAL and CURRENT, not estimated or outdated
- CRITICAL: Use proper number formatting (₹7,000 not ₹7000.00 or ₹7,000.00)
- CRITICAL: Avoid extra decimal places or formatting that could cause parsing errors
- CRITICAL: Hotel prices should be realistic (₹3,000-₹15,000 per night, ₹15,000-₹100,000 total)
- CRITICAL: Double-check totalPrice calculation: pricePerNight × nights × rooms = totalPrice
- CRITICAL: If pricePerNight is ₹7,000 and 5 nights for 2 people (1 room), totalPrice should be ₹35,000 NOT ₹350,000

CRITICAL FLIGHT ACCURACY RESEARCH:
- DO NOT include specific flight numbers as they change frequently and may be incorrect
- Use CORRECT airport codes (DEL=Delhi, BOM=Mumbai, DXB=Dubai, DMM=Dammam, LHR=London, CDG=Paris, JFK=New York)
- Format routes as "ORIGIN-DESTINATION" (e.g., "DEL-DXB", "BOM-DOH", "DMM-DEL")
- Provide actual departure/arrival times with proper timezone formatting
- Use real airline names and official booking URLs
- Focus on flight availability and pricing rather than specific flight numbers
- Return flight should be a different airline/flight than outbound when possible

CRITICAL VISA RESEARCH:
- Research ACTUAL visa requirements for the destination country
- Check visa requirements based on user's nationality (if provided)
- Find REAL visa costs from official embassy/consulate websites
- Verify current processing times and requirements
- Include embassy/consulate locations and contact information
- Provide official visa application website URLs
- Include important notes about visa application process
- ALWAYS reference the visa page for comprehensive information

PRICING ACCURACY REQUIREMENTS:
- Hotel totalPrice MUST equal pricePerNight × number of nights × travelers (if per person) OR pricePerNight × number of nights × rooms needed (if per room)
- If hotel price is per person, multiply by number of travelers in totalPrice
- If hotel price is per room, calculate rooms needed based on travelers (typically 2 people per room)
- Flight prices should be per person, totalFlightCost = (outbound + return) × travelers
- Return flight price may differ from outbound flight price
- Activity costs should be per person × number of travelers
- Food costs should be per person per day × number of travelers × number of days
- Transportation costs should be per person × number of travelers
- Provide price ranges (low, high, average) for flights
- Include alternative hotel options with different price points
- Ensure all calculations are mathematically correct
- ALWAYS specify pricing model (per person vs per room) in descriptions

CRITICAL COST CALCULATION RULES:
- ALL costs must be calculated for the EXACT number of travelers specified: ${conversationState?.travelers || '1 person'}
- Flight costs: (outbound price + return price) × number of travelers
- Hotel costs: 
  * If per person: price per person per night × number of nights × number of travelers
  * If per room: price per room per night × number of nights × rooms needed (calculate rooms based on travelers)
- Activity costs: price per person × number of travelers
- Food costs: daily food budget per person × number of travelers × number of days
- Transportation costs: price per person × number of travelers
- Total trip cost: sum of all individual costs for all travelers
- CRITICAL: Always specify if hotel prices are per person or per room
- CRITICAL: All individual prices should be per person, total prices should be for all travelers

FLIGHT ACCURACY REQUIREMENTS:
- DO NOT include specific flight numbers as they change frequently and may be incorrect
- Use CORRECT airport codes (e.g., DEL for Delhi, BOM for Mumbai, DXB for Dubai, DMM for Dammam)
- Format routes as "ORIGIN-DESTINATION" (e.g., "DEL-DXB", "BOM-DOH")
- Provide actual departure/arrival times with proper timezone formatting
- Use real airline names and booking URLs
- Focus on flight availability and pricing rather than specific flight numbers

COORDINATE ACCURACY REQUIREMENTS:
- Use EXACT coordinates for all locations (hotels, attractions, activities)
- Verify coordinates are valid and can be plotted on maps
- Use decimal degrees format (e.g., 26.425699, 50.055164)
- Ensure coordinates are within the correct country/region
- Test coordinates by plotting them on a map to verify accuracy

VISA ACCURACY REQUIREMENTS:
- Research REAL visa requirements for the specific destination and user's nationality
- Provide ACCURATE visa costs in user's preferred currency
- Include COMPLETE document requirements list
- Specify EXACT processing times (varies by country and visa type)
- Provide embassy/consulate locations and application URLs
- Include important notes about visa application process
- ALWAYS include reference to visa page for detailed information
- Verify visa requirements are current and up-to-date

EXAMPLE OF CORRECT JSON FORMAT:
{
  "destination": {
    "name": "Paris",
    "country": "France",
    "coordinates": {"lat": 48.8566, "lng": 2.3522},
    "overview": "Paris is the capital of France, known for its art, fashion, and cuisine.",
    "highlights": ["Eiffel Tower", "Louvre Museum", "Notre-Dame Cathedral"],
    "bestTimeToVisit": "April to June and September to November",
    "timeZone": "CET (UTC+1)",
    "language": "French",
    "currency": "Euro (EUR)"
  },
  "duration": "5 days",
  "startDate": "2025-10-15",
  "endDate": "2025-10-19",
  "travelers": 2,
  "numberOfTravelers": 2,
  "flights": {
    "outbound": {
      "airline": "Air France",
      "flightNumber": "AF 123",
      "route": "JFK to CDG",
      "departure": "2024-03-15T14:30+00:00",
      "arrival": "2024-03-16T06:45+01:00",
      "duration": "7h 15m",
      "price": "${preferences.defaultCurrency === 'EUR' ? '€650' : preferences.defaultCurrency === 'INR' ? '₹54,000' : '$650'}",
      "class": "Economy",
      "bookingUrl": "https://www.airfrance.com"
    }
  },
  "accommodation": {
    "name": "Hotel Plaza Athénée",
    "type": "Luxury Hotel",
    "location": "8th Arrondissement",
    "coordinates": {"lat": 48.8566, "lng": 2.3522},
    "address": "25 Avenue Montaigne, 75008 Paris, France",
    "pricePerNight": "${preferences.defaultCurrency === 'EUR' ? '€400/night' : preferences.defaultCurrency === 'INR' ? '₹33,000/night' : '$400/night'}",
    "totalPrice": "${preferences.defaultCurrency === 'EUR' ? '€2000 (5 nights)' : preferences.defaultCurrency === 'INR' ? '₹165,000 (5 nights)' : '$2000 (5 nights)'}",
    "rating": "4.8/5 stars",
    "amenities": ["Free WiFi", "Spa", "Restaurant", "Concierge"],
    "bookingUrl": "https://www.booking.com/hotel/fr/plaza-athenee"
  },
  "costBreakdown": {
    "flights": "${preferences.defaultCurrency === 'EUR' ? '€1300' : preferences.defaultCurrency === 'INR' ? '₹108,000' : '$1300'}",
    "accommodation": "${preferences.defaultCurrency === 'EUR' ? '€2000' : preferences.defaultCurrency === 'INR' ? '₹165,000' : '$2000'}",
    "food": "${preferences.defaultCurrency === 'EUR' ? '€500' : preferences.defaultCurrency === 'INR' ? '₹41,000' : '$500'}",
    "activities": "${preferences.defaultCurrency === 'EUR' ? '€300' : preferences.defaultCurrency === 'INR' ? '₹25,000' : '$300'}",
    "transportation": "${preferences.defaultCurrency === 'EUR' ? '€150' : preferences.defaultCurrency === 'INR' ? '₹12,000' : '$150'}",
    "miscellaneous": "${preferences.defaultCurrency === 'EUR' ? '€200' : preferences.defaultCurrency === 'INR' ? '₹16,000' : '$200'}",
    "total": "${preferences.defaultCurrency === 'EUR' ? '€4450' : preferences.defaultCurrency === 'INR' ? '₹367,000' : '$4450'}",
    "dailyBudget": "${preferences.defaultCurrency === 'EUR' ? '€890/day' : preferences.defaultCurrency === 'INR' ? '₹73,000/day' : '$890/day'}",
    "currency": "${preferences.defaultCurrency || 'USD'}",
    "lastUpdated": "2024-01-15"
  }
}

IMPORTANT: Return your response as a valid JSON object with this exact structure:

{
  "destination": {
    "name": "City Name",
    "country": "Country Name",
    "coordinates": {
      "lat": 25.2048,
      "lng": 55.2708
    },
    "overview": "Brief destination overview",
    "highlights": ["Key attraction 1", "Key attraction 2"],
    "bestTimeToVisit": "Best time info",
    "timeZone": "Time zone info",
    "language": "Primary language",
    "currency": "Local currency"
  },
  "duration": "X days",
  "startDate": "YYYY-MM-DD (if specified or suggested based on best time to visit)",
  "endDate": "YYYY-MM-DD (calculated from startDate + duration)",
  "travelers": number (extract from user message: solo=1, couple=2, family=3-4, group=4-6, or user specified - MUST be numeric),
  "numberOfTravelers": number (same as travelers field for compatibility - MUST be numeric),
  "flights": {
    "outbound": {
      "airline": "Real airline name (e.g., Emirates, Qatar Airways, Saudia, Air India)",
      "route": "EXACT route with correct airport codes (e.g., 'DEL-DXB', 'BOM-DOH', 'DEL-DMM')",
      "departure": "Actual departure time with timezone (e.g., '2025-10-10T03:30+05:30')",
      "arrival": "Actual arrival time with timezone (e.g., '2025-10-10T06:45+03:00')",
      "duration": "Flight duration (e.g., '5h 45m', '3h 30m')",
      "price": "REAL current price in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€450' : preferences.defaultCurrency === 'INR' ? '₹37,000' : '$450'})",
      "class": "Travel class (Economy, Business, First)",
      "bookingUrl": "Official booking website or airline website",
      "connections": "Direct or connecting flights (e.g., 'Direct', '1 stop via DXB', '2 stops via DXB and IST')",
      "layoverTime": "Layover duration if connecting (e.g., '2h 30m in DXB')",
      "aircraft": "Aircraft type (e.g., 'Boeing 777-300ER', 'Airbus A380', 'Boeing 787')",
      "baggage": "Baggage allowance (e.g., '23kg checked, 7kg carry-on')",
      "priceRange": {
        "low": "Lowest price in ${preferences.defaultCurrency || 'USD'}",
        "high": "Highest price in ${preferences.defaultCurrency || 'USD'}",
        "average": "Average price in ${preferences.defaultCurrency || 'USD'}"
      }
    },
    "return": {
      "airline": "Real airline name (may be different from outbound)",
      "route": "EXACT return route with correct airport codes (e.g., 'DXB-DEL', 'DOH-BOM', 'DMM-DEL')",
      "departure": "Actual departure time with timezone (e.g., '2025-10-15T08:00+03:00')",
      "arrival": "Actual arrival time with timezone (e.g., '2025-10-15T16:30+05:30')",
      "duration": "Flight duration (e.g., '5h 30m', '3h 45m')",
      "price": "REAL current price in ${preferences.defaultCurrency || 'USD'} (may differ from outbound)",
      "class": "Travel class (Economy, Business, First)",
      "bookingUrl": "Official booking website or airline website",
      "connections": "Direct or connecting flights",
      "layoverTime": "Layover duration if connecting",
      "aircraft": "Aircraft type",
      "baggage": "Baggage allowance",
      "priceRange": {
        "low": "Lowest price in ${preferences.defaultCurrency || 'USD'}",
        "high": "Highest price in ${preferences.defaultCurrency || 'USD'}",
        "average": "Average price in ${preferences.defaultCurrency || 'USD'}"
      }
    },
    "totalFlightCost": "Total cost for both outbound and return flights in ${preferences.defaultCurrency || 'USD'}",
    "priceAnalysis": {
      "bestTimeToBook": "Best time to book for lowest prices",
      "priceTrend": "Current price trend (rising, stable, falling)",
      "savingsTip": "Tip to save money on flights"
    }
  },
  "accommodation": {
    "primary": {
      "name": "Real hotel name (e.g., Burj Al Arab, Atlantis The Palm)",
      "type": "Hotel type (e.g., Luxury Resort, Business Hotel)",
    "location": "Specific location/district name",
    "coordinates": {
      "lat": 25.1975,
      "lng": 55.2796
    },
    "address": "Full hotel address",
      "pricePerNight": "REAL current price per room per night in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€200/room/night' : preferences.defaultCurrency === 'INR' ? '₹7,000/room/night' : '$200/room/night'}) - ALWAYS specify 'per room' or 'per person' - Use reasonable prices (hotels: ₹3,000-₹15,000 per night)",
      "totalPrice": "REAL total accommodation cost for the trip duration in ${preferences.defaultCurrency || 'USD'} (pricePerNight × number of nights × number of rooms needed) - MUST be reasonable (hotels: ₹15,000-₹100,000 total) - CRITICAL: Ensure totalPrice is mathematically correct",
      "rating": "Hotel rating (e.g., 4.5/5 stars)",
      "amenities": ["Real amenities like 'Free WiFi', 'Pool', 'Spa'"],
      "bookingUrl": "Official booking website (e.g., Booking.com, hotel website)",
      "checkIn": "Check-in time",
      "checkOut": "Check-out time",
      "cancellationPolicy": "Cancellation policy details"
    },
    "alternatives": [
      {
        "name": "Alternative hotel name 1",
        "type": "Hotel type",
        "location": "Location",
        "pricePerNight": "Price per night in ${preferences.defaultCurrency || 'USD'}",
        "totalPrice": "Total price for stay in ${preferences.defaultCurrency || 'USD'}",
        "rating": "Hotel rating",
        "amenities": ["Key amenities"],
        "bookingUrl": "Booking URL",
        "whyRecommended": "Why this is a good alternative"
      },
      {
        "name": "Alternative hotel name 2",
        "type": "Hotel type",
        "location": "Location",
        "pricePerNight": "Price per night in ${preferences.defaultCurrency || 'USD'}",
        "totalPrice": "Total price for stay in ${preferences.defaultCurrency || 'USD'}",
        "rating": "Hotel rating",
        "amenities": ["Key amenities"],
        "bookingUrl": "Booking URL",
        "whyRecommended": "Why this is a good alternative"
      }
    ]
  },
  "itinerary": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "Time",
          "activity": "Activity name",
          "location": "EXACT location name (e.g., 'Burj Khalifa', 'Eiffel Tower', 'Times Square')",
          "coordinates": {
            "lat": 25.1972,
            "lng": 55.2744
          },
          "address": "Full address if available",
          "duration": "Duration",
          "cost": "Cost"
        }
      ]
    }
  ],
  "foodGuide": {
    "mustTryDishes": ["Dish 1", "Dish 2"],
    "recommendedRestaurants": [
      {
        "name": "Restaurant name",
        "location": "Specific district/area name",
        "coordinates": {
          "lat": 25.2048,
          "lng": 55.2708
        },
        "address": "Restaurant address",
        "cuisine": "Cuisine type", 
        "priceRange": "Price range",
        "specialty": "Specialty"
      }
    ],
    "foodBudget": "Food budget",
    "averageMealCost": "Average meal cost"
  },
  "transportation": {
    "fromAirport": "Airport transport info",
    "localTransport": "Local transport info",
    "recommendedApps": ["App 1", "App 2"],
    "walkability": "Walkability info",
    "tips": ["Tip 1", "Tip 2"]
  },
  "visaInfo": {
    "required": true,
    "type": "Tourist Visa / Business Visa / Transit Visa",
    "duration": "30-90 days (varies by visa type and nationality)",
    "cost": "REAL current visa cost in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€80' : preferences.defaultCurrency === 'INR' ? '₹6,500' : '$80'})",
    "requirements": [
      "Passport (6+ months validity)",
      "Visa application form",
      "Passport photos (2-4 recent)",
      "Travel itinerary",
      "Hotel booking confirmation",
      "Bank statements (3-6 months)",
      "Travel insurance"
    ],
    "processingTime": "3-15 business days (varies by country and visa type)",
    "onlineApplication": true,
    "visaOnArrival": false,
    "embassyLocation": "Nearest embassy/consulate address",
    "applicationUrl": "Official visa application website",
    "importantNotes": [
      "Check visa requirements based on your nationality",
      "Some countries require biometric data collection",
      "Visa fees are non-refundable even if application is rejected",
      "Processing times may vary during peak travel seasons"
    ],
    "visaPageReference": "For detailed visa information, requirements, and step-by-step application process, please visit our comprehensive Visa Information page"
  },
  "costBreakdown": {
    "flights": "REAL current flight cost in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€800' : preferences.defaultCurrency === 'INR' ? '₹66,000' : '$800'})",
    "accommodation": "REAL current hotel cost in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€1,200' : preferences.defaultCurrency === 'INR' ? '₹99,000' : '$1,200'})",
    "food": "REAL current food cost in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€300' : preferences.defaultCurrency === 'INR' ? '₹25,000' : '$300'})",
    "activities": "REAL current activities cost in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€400' : preferences.defaultCurrency === 'INR' ? '₹33,000' : '$400'})",
    "transportation": "REAL current transport cost in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€150' : preferences.defaultCurrency === 'INR' ? '₹12,000' : '$150'})", 
    "miscellaneous": "REAL current misc cost in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€200' : preferences.defaultCurrency === 'INR' ? '₹16,000' : '$200'})",
    "total": "REAL total trip cost in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€3,050' : preferences.defaultCurrency === 'INR' ? '₹251,000' : '$3,050'})",
    "dailyBudget": "REAL daily budget in ${preferences.defaultCurrency || 'USD'} (e.g., ${preferences.defaultCurrency === 'EUR' ? '€305/day' : preferences.defaultCurrency === 'INR' ? '₹25,000/day' : '$305/day'})",
    "currency": "${preferences.defaultCurrency || 'USD'}",
    "lastUpdated": "Current date when prices were researched"
  },
  "insiderTips": ["Tip 1", "Tip 2", "Tip 3"],
  "packing": {
    "essentials": ["Passport and visa documents", "Lightweight clothing", "Sunscreen", "Insect repellent", "Universal power adapter", "First aid kit", "Travel insurance documents"],
    "seasonal": ["Appropriate clothing for the season", "Weather-specific items", "Comfortable walking shoes"],
    "culturalConsiderations": ["Respectful clothing for religious sites", "Local customs awareness", "Language translation app"],
    "electronics": ["Phone and charger", "Camera", "Power bank", "Universal adapter"],
    "documents": ["Passport", "Visa", "Travel insurance", "Hotel confirmations", "Flight tickets"],
    "health": ["Prescription medications", "First aid kit", "Hand sanitizer", "Face masks if required"],
    "tips": ["Pack light for easy mobility", "Check airline baggage restrictions", "Keep important documents in carry-on"]
  },
  "quickActions": [
    "Book flights from {homeAirport} to {destination}",
    "Reserve hotels in {destination}",
    "Check weather in {destination}",
    "Arrange local transport in {destination}",
    "Check visa requirements for {destinationCountry}",
    "View current travel prices for {destination}"
  ]
}

Make this a comprehensive travel guide with real, researched information. Focus on providing incredible value and insights.`;
  }

  /**
   * Create a prompt for travel-related questions (not full trip planning)
   */
  private createTravelQuestionPrompt(request: TripPlanRequest): string {
    const { userMessage, preferences } = request;
    
    return `You are SkyNeu, a specialized AI travel assistant. Answer this travel-related question: "${userMessage}"

User Context:
- Home Location: ${preferences.location || 'Not specified'}
- Travel Experience: ${preferences.travelStyle || 'Not specified'}
- Budget Preference: ${preferences.budgetRange || 'Not specified'}

Provide a helpful, accurate, and practical response focused on travel advice. Include:
- Direct answer to their question
- Practical tips and recommendations
- Real-world insights and current information
- Relevant warnings or considerations
- Helpful resources or next steps

Keep your response conversational but informative. Focus on actionable travel advice.`;
  }

  /**
   * Handle non-travel queries with appropriate redirection
   */
  private handleNonTravelQuery(userMessage: string, _reason: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('flight') || message.includes('aviation') || message.includes('skyneu')) {
      return `🔄 **I see you're asking about flight services!**

I'm specifically designed for **AI Trip Planning**. For flight-related queries, please use our specialized services:

✈️ **Flight Search** - Search and compare flights
📍 **Flight Tracker** - Track real-time flight status  
🎓 **Aviation Education** - Learn about aviation
💬 **AI Chat Assistant** - General aviation questions

You can find these services in the **Services** dropdown menu.

**I can help you with:**
🗺️ Complete trip planning and itineraries
🏨 Accommodation recommendations
🍽️ Food and restaurant suggestions
📋 Visa and travel requirements
💰 Budget planning and cost breakdowns
🎯 Activity and attraction recommendations

Try asking me something like: *"Plan a 5-day trip to Paris for food lovers"*`;
    }
    
    return `🚨 **Oops! I'm your specialized AI Trip Planner**

I'm designed specifically for **travel and trip planning**. I can't help with non-travel questions.

**I can help you with:**
✈️ Complete trip planning and detailed itineraries
🌍 Destination research and recommendations
🏨 Accommodation and restaurant suggestions
📋 Visa requirements and travel documentation
💰 Budget planning and cost breakdowns
🎯 Activities, attractions, and cultural insights
🧳 Packing lists and travel tips

**For other questions, please try:**
💬 **AI Chat Assistant** - General questions (available in Services menu)
🔍 **Web search** - For current news, weather, or other topics

**Ready to plan your next adventure?** Try asking:
- *"Plan a 7-day trip to Japan for culture enthusiasts"*
- *"What are the visa requirements for traveling to Europe?"*
- *"Best time to visit Thailand and what to expect?"*`;
  }

  /**
   * Enhanced response method that returns structured data for the UI
   */
  async generateResponse(
    userMessage: string, 
    preferences: UserPreferences,
    conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
  ): Promise<{
    content: string;
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
  }> {
    // Build context from conversation history
    let contextualMessage = userMessage;
    let conversationState = {
      destination: undefined as string | undefined,
      dates: undefined as string | undefined,
      travelers: undefined as string | undefined,
      duration: undefined as string | undefined,
      hasAllDetails: false
    };

    if (conversationHistory && conversationHistory.length > 0) {
      // Extract conversation state from previous messages
      conversationState = this.extractConversationState(conversationHistory);
      
      // Build context with conversation history
      const previousMessages = conversationHistory.slice(-6); // Last 6 messages for better context
      const context = previousMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      contextualMessage = `Previous conversation:\n${context}\n\nUser: ${userMessage}`;
    }
    
    // Classify based on the user's latest message only to avoid bias from prior assistant prompts
    // Handle mid-plan change commands BEFORE classification
    const changeDestinationMatch = userMessage.match(/\bchange\s+(?:the\s+)?destination\s+(?:to|=)\s+(.+)/i);
    const changeDatesMatch = userMessage.match(/\bchange\s+(?:the\s+)?dates?\s+(?:to|=)\s+(.+)/i);

    if (changeDestinationMatch || changeDatesMatch) {
      // Build current state
      const baseState = conversationHistory && conversationHistory.length > 0
        ? this.extractConversationState(conversationHistory)
        : { destination: undefined, dates: undefined, travelers: undefined, duration: undefined, hasAllDetails: false };

      let updated = { ...baseState } as typeof baseState;
      if (changeDestinationMatch) {
        const newDest = changeDestinationMatch[1].trim().replace(/[.!?]$/, '');
        updated.destination = newDest;
      }
      if (changeDatesMatch) {
        const newDates = changeDatesMatch[1].trim().replace(/[.!?]$/, '');
        updated.dates = newDates;
      }
      updated.hasAllDetails = !!(updated.destination && updated.dates && updated.travelers);

      // Compose confirmation + next required step
      let confirm = '✅ Updated trip details:\n\n';
      if (updated.destination) confirm += `• Destination: ${updated.destination}\n`;
      if (updated.dates) confirm += `• Dates: ${updated.dates}\n`;
      if (updated.travelers) confirm += `• Travelers: ${updated.travelers}\n`;

      let nextPrompt = '';
      if (!updated.destination) {
        nextPrompt = "\n🌍 Where would you like to go?";
      } else if (!updated.dates) {
        nextPrompt = `\n📅 When would you like to travel to ${updated.destination}?`;
      } else if (!updated.travelers) {
        nextPrompt = `\n👥 How many people are traveling to ${updated.destination}?`;
      } else {
        nextPrompt = "\nI'm ready to create your personalized trip plan!\n\n🚀 Generate Trip Plan";
      }

      return {
        content: confirm + nextPrompt,
        tripPlan: undefined,
        conversationState: updated
      };
    }

    // Heuristic: if a planning flow is in progress and the user provides dates/travelers or confirms, force planning
    const isLikelyDateReply = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b\s*\d{1,2}[^\w]+\d{1,2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|\bnext\s+(?:week|month|summer|winter|year)\b|\b\d+\s+(?:days?|weeks?|months?)\b|\b\w+\s\d{1,2},?\s\d{4}\s*[-–]\s*\w+\s\d{1,2},?\s\d{4}\b)/i.test(userMessage);
    const isLikelyTravelerReply = /(\b\d+\b\s*(people|persons|travellers?|travelers?)\b|\bsolo\b|\bcouple\b|\bfamily\b|\bfamily\s+of\s+\d+\b)/i.test(userMessage);
    const isPlanningAffirmation = /\b(plan\s*it|yes\s*plan|okay\s*plan|ok\s*plan|do\s*it|go\s*ahead|create\s*itinerary|build\s*itinerary)\b/i.test(userMessage);
    const planningInProgress = !!(conversationState.destination || conversationState.dates || conversationState.travelers || (conversationState.hasAllDetails === false));

    if (planningInProgress && (isLikelyDateReply || isLikelyTravelerReply || isPlanningAffirmation)) {
      return await this.handleTripPlanningQuery(contextualMessage, userMessage, preferences, conversationState);
    }

    const classification = this.classifyQuery(userMessage);
    
    // Handle different query types
    switch (classification.type) {
      case 'greeting':
        return {
          content: `👋 **Hello! Welcome to SkyNeu!** ✈️\n\nI'm your intelligent travel companion, ready to help you plan amazing trips and adventures around the world!\n\n🌍 **What I can help you with:**\n• Plan complete trips with detailed itineraries\n• Find the best destinations and activities\n• Get personalized travel recommendations\n• Discover local cuisine and hidden gems\n• Budget planning and cost estimates\n• Travel tips and cultural insights\n\n**What would you like to explore today?** Just tell me:\n• Where you'd like to go\n• When you want to travel\n• What interests you most\n\nLet's start planning your next adventure! 🗺️✨`
        };
      
      case 'trip_planning':
        return await this.handleTripPlanningQuery(contextualMessage, userMessage, preferences, conversationState);
      
      case 'travel_question':
        // Build a lightweight conversation string for context (last few messages)
        let convo = '';
        if (conversationHistory && conversationHistory.length > 0) {
          const lastMsgs = conversationHistory.slice(-6);
          convo = lastMsgs.map(m => `${m.role}: ${m.content}`).join('\n');
        }
        // Answer directly using user's message, with optional context
        return await this.handleTravelQuestion(userMessage, preferences, convo);
      
      case 'service_redirect':
        const service = classification.service || this.detectServiceRedirect(userMessage) || 'unknown';
        let redirectMessage = "";
        let redirectUrl = "";
        let serviceDescription = "";
        
        switch (service) {
          case 'flightSearch':
            redirectMessage = "✈️ **Flight Search Service**";
            redirectUrl = "/flights"; // Adjust based on your routing
            serviceDescription = "Search and book flights with real-time prices and availability";
            break;
          case 'visa':
            redirectMessage = "🛂 **Visa Information Service**";
            redirectUrl = "/visa"; // Adjust based on your routing
            serviceDescription = "Check visa requirements and get application assistance";
            break;
          case 'flightTracking':
            redirectMessage = "📡 **Flight Tracking Service**";
            redirectUrl = "/flight-tracker"; // Adjust based on your routing
            serviceDescription = "Track flights in real-time with live updates and delays";
            break;
          case 'aviationEducation':
            redirectMessage = "🎓 **Aviation Education Service**";
            redirectUrl = "/aviation-education"; // Adjust based on your routing
            serviceDescription = "Learn about aviation, pilot training, and aviation courses";
            break;
          default:
            redirectMessage = "🔧 **SkyNeu Service**";
            redirectUrl = "/services";
            serviceDescription = "Access our specialized travel services";
        }
        
        return {
          content: `${redirectMessage}\n\nI'm redirecting you to our dedicated **${service}** service for the best experience!\n\n📋 **What you'll find there:**\n• ${serviceDescription}\n• Real-time data and updates\n• Specialized tools and features\n• Expert assistance\n\n🔗 **Click here to access:** ${redirectUrl}\n\n*This specialized service will provide you with more detailed and accurate information than I can offer here.*\n\n💡 **Or if you'd like trip planning help instead, just ask me to plan a trip!**`,
          redirectUrl: redirectUrl,
          serviceType: service
        };
      
      case 'skyneu_service':
        return {
          content: "I can help you with trip planning! For flight search, flight tracking, and aviation education, please use the dedicated SkyNeu services in the navigation menu. Would you like me to help you plan a trip instead?"
        };
      
      case 'non_travel':
        // Get the specific category that was blocked for more targeted response
        const blockResult = this.checkBlockedCategory(userMessage);
        const category = blockResult.category;
        
        let categoryMessage = "";
        if (category === 'entertainment') {
          categoryMessage = "🎭 I don't discuss movies, shows, games, or entertainment. ";
        } else if (category === 'tech') {
          categoryMessage = "💻 I don't provide coding help or tech support. ";
        } else if (category === 'politics') {
          categoryMessage = "🏛 I don't discuss politics, religion, or controversial topics. ";
        } else if (category === 'finance') {
          categoryMessage = "💰 I don't provide financial advice or discuss investments. ";
        } else if (category === 'adult') {
          categoryMessage = "🚫 I don't engage with inappropriate content. ";
        } else if (category === 'misc') {
          categoryMessage = "📝 I don't answer general knowledge or personal questions. ";
        }
        
        return {
          content: `🚫 **I'm SkyNeu - Your Travel Assistant Only!**\n\n${categoryMessage}I'm specifically designed to help with **travel and trip planning only**.\n\n❌ **What I DON'T do:**\n• Entertainment (movies, games, music, sports)\n• Technology, programming, or coding help\n• Finance, stocks, or business advice\n• Health, medical, or legal advice\n• Personal questions or social media\n• Politics, religion, or controversial topics\n• General knowledge or homework help\n• Inappropriate or offensive content\n\n✅ **What I DO:**\n\n✈️ **Trip Planning**\n• Create personalized itineraries\n• Suggest destinations and activities\n• Plan accommodations and budgets\n• Book flights and hotels\n\n🌍 **Travel Advice**\n• Best places to visit worldwide\n• Travel tips and recommendations\n• Destination guides and insights\n• Visa and travel requirements\n\n💡 **Try these instead:**\n• \"Plan a 7-day trip to Japan\"\n• \"Best places to visit in Europe\"\n• \"What to do in Bangkok?\"\n• \"Romantic weekend getaway ideas\"\n• \"Travel tips for India\"\n\n**Please ask me only about travel and trip planning!** 🧳✈️`
        };
      
      default:
        return await this.handleTravelQuestion(userMessage, preferences);
    }
  }

  /**
   * Calculate duration from date range
   */
  private calculateDurationFromDates(dates: string): string {
    try {
      // Handle various date formats
      const datePatterns = [
        // "Oct 25, 2025 - Oct 29, 2025"
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\s*[-–]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i,
        // "25-10-2025 to 29-10-2025"
        /\d{1,2}-\d{1,2}-\d{4}\s*[-–]\s*\d{1,2}-\d{1,2}-\d{4}/i,
        // "25/10/2025 to 29/10/2025"
        /\d{1,2}\/\d{1,2}\/\d{4}\s*[-–]\s*\d{1,2}\/\d{1,2}\/\d{4}/i,
        // "Oct 25-29, 2025"
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}[-–]\d{1,2},?\s+\d{4}/i
      ];

      for (const pattern of datePatterns) {
        const match = dates.match(pattern);
        if (match) {
          const dateStr = match[0];
          
          // Try to parse the dates
          let startDate: Date, endDate: Date;
          
          if (dateStr.includes(',')) {
            // Handle "Oct 25, 2025 - Oct 29, 2025" format
            const parts = dateStr.split(/\s*[-–]\s*/);
            if (parts.length === 2) {
              startDate = new Date(parts[0].trim());
              endDate = new Date(parts[1].trim());
            } else {
              continue;
            }
          } else if (dateStr.includes('/')) {
            // Handle "25/10/2025 to 29/10/2025" format
            const parts = dateStr.split(/\s*[-–]\s*/);
            if (parts.length === 2) {
              startDate = new Date(parts[0].trim());
              endDate = new Date(parts[1].trim());
            } else {
              continue;
            }
          } else if (dateStr.includes('-')) {
            // Handle "25-10-2025 to 29-10-2025" format
            const parts = dateStr.split(/\s*[-–]\s*/);
            if (parts.length === 2) {
              startDate = new Date(parts[0].trim());
              endDate = new Date(parts[1].trim());
            } else {
              continue;
            }
          } else {
            continue;
          }

          // Calculate difference in days
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const timeDiff = endDate.getTime() - startDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days
            
            if (daysDiff === 1) {
              return '1 day';
            } else if (daysDiff < 7) {
              return `${daysDiff} days`;
            } else if (daysDiff === 7) {
              return '1 week';
            } else if (daysDiff < 14) {
              return `${Math.ceil(daysDiff / 7)} weeks`;
            } else {
              return `${daysDiff} days`;
            }
          }
        }
      }
    } catch (error) {

    }
    
    return 'calculated duration';
  }

  /**
   * Extract conversation state from previous messages
   */
  private extractConversationState(conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>): {
    destination: string | undefined;
    dates: string | undefined;
    travelers: string | undefined;
    duration: string | undefined;
    hasAllDetails: boolean;
  } {
    const state = {
      destination: undefined as string | undefined,
      dates: undefined as string | undefined,
      travelers: undefined as string | undefined,
      duration: undefined as string | undefined,
      hasAllDetails: false
    };

    // Process messages in order to build conversation state
    for (const message of conversationHistory) {
      if (message.role === 'user') {
        
        // Extract destination from user messages
        if (!state.destination) {
          const destination = this.extractDestination(message.content);
          if (destination) {
            state.destination = typeof destination === 'string' ? destination : (destination as any)?.name;
          } else {
            // Check if it's a simple destination name (like "dubai", "tokyo", etc.)
            const simpleDestination = /^[A-Za-z][a-zA-Z\s,]+$/.test(message.content.trim()) && 
                                    !message.content.toLowerCase().includes('people') &&
                                    !message.content.toLowerCase().includes('month') &&
                                    !message.content.toLowerCase().includes('week') &&
                                    !message.content.toLowerCase().includes('day') &&
                                    message.content.trim().length > 2 &&
                                    message.content.trim().length < 50;
            if (simpleDestination) {
              state.destination = message.content.trim();
            }
          }
        }
        
        // Extract dates from user messages
        if (!state.dates) {
          const hasDates = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s]*\d{1,2}[-–]\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|next month|this month|next week|this week|in \d+ days?|in \d+ weeks?|in \d+ months?|tomorrow|today|yesterday|next year|this year|next \w+|this \w+|end of \w+|beginning of \w+|middle of \w+|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i.test(message.content);
          if (hasDates) {
            const dateMatch = message.content.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]*\d{1,2}[-–]\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}|next month|this month|next week|this week)/i);
            state.dates = dateMatch ? dateMatch[1] : 'selected dates';
          } else {
            // Check for specific date range format like "Oct 25, 2025 - Oct 29, 2025"
            const dateRangeMatch = message.content.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4})/i);
            if (dateRangeMatch) {
              state.dates = dateRangeMatch[1];
            }
          }
        }
        
        // Extract travelers from user messages
        if (!state.travelers) {
          const hasTravelers = /\b(?:\d+\s*(?:people|person|travelers|traveler|passenger|pax)|solo|alone|couple|with.*friend|with.*family|family of \d+|group of \d+|party of \d+|me and|us|we are|i am|for \d+|traveling with|going with|accompanied by|bringing|bringing along)\b/i.test(message.content);
          if (hasTravelers) {
            // Try to extract the number and format
            const travelerMatch = message.content.match(/(\d+)\s*(?:people|person|travelers|traveler)/i);
            if (travelerMatch) {
              state.travelers = travelerMatch[1] + ' people';
            } else {
              // Check for standalone numbers (like "2" without "people")
              const numberMatch = message.content.match(/\b(\d+)\b/);
              if (numberMatch && parseInt(numberMatch[1]) >= 1 && parseInt(numberMatch[1]) <= 20) {
                const count = parseInt(numberMatch[1]);
                state.travelers = count === 1 ? '1 person' : count + ' people';
            } else {
              // Check for other patterns
              const soloMatch = message.content.match(/\b(solo|alone)\b/i);
              const coupleMatch = message.content.match(/\b(couple)\b/i);
              const familyMatch = message.content.match(/\b(family of \d+|group of \d+|party of \d+)\b/i);
              
              if (soloMatch) {
                state.travelers = '1 person';
              } else if (coupleMatch) {
                state.travelers = '2 people';
              } else if (familyMatch) {
                state.travelers = familyMatch[1];
              } else {
                  // Default to 1 traveler if we can't determine the count
                  state.travelers = '1 person';
                }
              }
            }

          }
        }
        
        // Extract duration from user messages
        if (!state.duration) {
          const hasDuration = /\b(?:\d+\s*(?:days?|nights?|weeks?)|weekend|long weekend|week long|fortnight|month long|next month|this month|next week|this week|in \d+ days?|in \d+ weeks?|in \d+ months?|tomorrow|today|yesterday|next year|this year|next \w+|this \w+|end of \w+|beginning of \w+|middle of \w+)\b/i.test(message.content);
          if (hasDuration) {
            const durationMatch = message.content.match(/(\d+\s*(?:days?|nights?|weeks?)|weekend|long weekend|week long|fortnight|month long)/i);
            state.duration = durationMatch ? durationMatch[1] : 'selected duration';
          }
        }
      }
    }

    // Check if we have all required details
    state.hasAllDetails = !!(state.destination && state.dates && state.travelers);

    return state;
  }

  /**
   * Handle trip planning queries - generate full trip plans
   */
  private async handleTripPlanningQuery(
    contextualMessage: string,
    userMessage: string,
    preferences: UserPreferences,
    conversationState?: {
      destination?: string;
      dates?: string;
      travelers?: string;
      duration?: string;
      hasAllDetails: boolean;
    }
  ): Promise<{
    content: string;
    tripPlan?: any;
    conversationState?: {
      destination?: string;
      dates?: string;
      travelers?: string;
      duration?: string;
      hasAllDetails: boolean;
    };
  }> {
    // Check if user wants AI to plan everything or is asking for full trip plan - only check current user message
    const letAIPlan = /\b(?:let ai plan|ai plan everything|plan everything|surprise me|you decide|recommend|suggest|best time|optimal|plan full trip|full trip plan|complete trip|detailed trip|comprehensive trip)\b/i.test(userMessage);
    
    // Use conversation state if available, otherwise extract from current message only
    const extractedDestination = this.extractDestination(userMessage); // Extract from user message, not contextual message
    const currentDestination = conversationState?.destination || (extractedDestination ? (typeof extractedDestination === 'string' ? extractedDestination : (extractedDestination as any)?.name) : undefined);
    // Simplified date detection - only match clear date patterns in current user message
    const hasDates = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s]*\d{1,2}[-–]\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|next month|this month|next week|this week|in \d+ days?|in \d+ weeks?|in \d+ months?|tomorrow|today|yesterday|next year|this year|next \w+|this \w+|end of \w+|beginning of \w+|middle of \w+|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i.test(userMessage);
    let currentDates = conversationState?.dates;
    if (!currentDates && hasDates) {
      const dateMatch = userMessage.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]*\d{1,2}[-–]\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}|next month|this month|next week|this week)/i);
      currentDates = dateMatch ? dateMatch[1] : 'selected dates';
    }
    // Simplified traveler detection - only match clear traveler patterns in current user message
    const hasTravelers = /\b(?:\d+\s*(?:people|person|travelers|traveler|passenger|pax)|solo|alone|couple|with.*friend|with.*family|family of \d+|group of \d+|party of \d+|me and|us|we are|i am|for \d+|traveling with|going with|accompanied by|bringing|bringing along)\b/i.test(userMessage);
    const currentTravelers = conversationState?.travelers || (hasTravelers ? '1 person' : undefined);
    // Simplified duration detection - only match clear duration patterns in current user message
    const hasDuration = /\b(?:\d+\s*(?:days?|nights?|weeks?)|weekend|long weekend|week long|fortnight|month long|next month|this month|next week|this week|in \d+ days?|in \d+ weeks?|in \d+ months?|tomorrow|today|yesterday|next year|this year|next \w+|this \w+|end of \w+|beginning of \w+|middle of \w+)\b/i.test(userMessage);
    const currentDuration = conversationState?.duration || (hasDuration ? 'selected duration' : undefined);
    
    // Calculate duration from dates if we have dates but no duration
    let calculatedDuration = currentDuration;
    if (currentDates && !currentDuration) {
      calculatedDuration = this.calculateDurationFromDates(currentDates);
    }

    // Update conversation state with current message info
    const updatedState = {
      destination: currentDestination,
      dates: currentDates,
      travelers: currentTravelers,
      duration: calculatedDuration,
      hasAllDetails: !!(currentDestination && currentDates && currentTravelers)
    };
    
    // Count how many details are missing - only require destination, dates, and travelers
    let missingDetails: string[] = [];
    if (!updatedState.destination) missingDetails.push('destination');
    if (!updatedState.dates && !letAIPlan) missingDetails.push('dates');
    if (!updatedState.travelers && !letAIPlan) missingDetails.push('travelers');
    // Removed duration requirement - it's optional
    
    // If user wants AI to plan everything, treat as having all details
    if (letAIPlan && updatedState.destination) {
      // Continue to generate trip plan with AI suggestions
    }

    // Ask for missing details if ANY are missing (unless user wants AI to plan everything)
    // But be more lenient if user is explicitly asking for full trip plan
    const isExplicitFullTripRequest = /\b(?:plan full trip|full trip plan|complete trip|detailed trip|comprehensive trip)\b/i.test(userMessage);
    if (missingDetails.length >= 1 && !letAIPlan && !isExplicitFullTripRequest) {
      const destinationName = updatedState.destination 
        ? (typeof updatedState.destination === 'string' ? updatedState.destination : (updatedState.destination as any)?.name || 'this destination')
        : 'your destination';
      
      let message = '';
      
      // Create conversational, step-by-step questions
      if (!updatedState.destination) {
        message = `🌍 **Where would you like to go?**\n\nPlease tell me your destination, or say "**surprise me**" if you'd like me to suggest an exciting destination!\n\n*Example: "Tokyo", "Paris, France", "Maldives"*`;
      } else if (!updatedState.dates) {
        message = `📅 **When would you like to travel to ${destinationName}?**\n\nYou can:\n• Click the 📅 calendar button to select dates\n• Specify dates: *"December 15-20"* or *"June 2025"*\n• Use relative time: *"next month"*, *"in 2 weeks"*, *"this summer"*\n• Let me decide: Say **"best time to visit"** and I'll suggest optimal dates\n\n*What works best for you?*`;
      } else if (!updatedState.travelers) {
        message = `👥 **How many people are traveling to ${destinationName}?**\n\nYou can:\n• Tell me the number: *"2 people"*, *"family of 4"*, *"solo"*\n• Describe the group: *"couple"*, *"friends"*, *"family with kids"*\n\n*Who's joining you on this adventure?*`;
      }
      
      message += `\n\n💡 **Quick tip:** You can also say "**let AI plan everything**" and I'll create the perfect trip with optimal dates, duration, and recommendations!`;
      
      // DON'T return a tripPlan when asking for details - this prevents the "View Full Trip Plan" button from showing
      return {
        content: message,
        conversationState: updatedState
        // No tripPlan property - this will hide the "View Full Trip Plan" button
      };
    }
    
    // If user is asking for full trip plan but missing some details, generate with AI suggestions
    if (isExplicitFullTripRequest && missingDetails.length > 0) {

    }

    // If we have destination and dates but no travelers, ask for travelers
    if (updatedState.destination && updatedState.dates && !updatedState.travelers && !letAIPlan) {
      const destinationName = typeof updatedState.destination === 'string' ? updatedState.destination : (updatedState.destination as any)?.name || 'this destination';
      
      const message = `Perfect! I have your destination and dates:\n\n✅ **Destination:** ${destinationName}\n✅ **Dates:** ${updatedState.dates}\n\nNow I just need to know:\n\n👥 **How many people are traveling to ${destinationName}?**\n\nYou can:\n• Tell me the number: *"2 people"*, *"family of 4"*, *"solo"*\n• Describe the group: *"couple"*, *"friends"*, *"family with kids"*\n\n*Who's joining you on this adventure?*`;
      
      return {
        content: message,
        conversationState: updatedState
        // No tripPlan property - this will show the traveler picker
      };
    }

    // If user is explicitly asking for trip plan generation, generate it immediately
    if (isExplicitFullTripRequest || letAIPlan || userMessage.toLowerCase().includes('plan full trip')) {
      // Force trip plan generation even if state is incomplete
      if (!updatedState.hasAllDetails) {

        // Extract missing details from conversation context
        const contextDestination = this.extractDestination(contextualMessage);
        if (contextDestination && !updatedState.destination) {
          updatedState.destination = typeof contextDestination === 'string' ? contextDestination : (contextDestination as any)?.name;
        }
        if (!updatedState.dates) {
          updatedState.dates = 'selected dates';
        }
        if (!updatedState.travelers) {
          updatedState.travelers = '1 person';
        }
        updatedState.hasAllDetails = true;

      }
      
      // If we still don't have complete state, use the conversation state from previous messages
      if (!updatedState.hasAllDetails && conversationState) {

        updatedState.destination = updatedState.destination || conversationState.destination;
        updatedState.dates = updatedState.dates || conversationState.dates;
        updatedState.travelers = updatedState.travelers || conversationState.travelers;
        updatedState.duration = updatedState.duration || conversationState.duration;
        updatedState.hasAllDetails = !!(updatedState.destination && updatedState.dates && updatedState.travelers);

      }
      
      // Continue to trip plan generation below - don't return early
    }
    // If we have most details (destination + dates + travelers), show confirmation message
    else if (updatedState.hasAllDetails) {
      // Show confirmation message with button
      const destinationName = typeof updatedState.destination === 'string' ? updatedState.destination : (updatedState.destination as any)?.name || 'this destination';
      
      // Ensure proper traveler display
      let displayTravelers = updatedState.travelers || 'your group';
      if (displayTravelers === 'travelers') {
        displayTravelers = '1 person'; // Default fallback
      }
      
      const confirmationMessage = `Perfect! I have all the details I need:\n\n✅ **Destination:** ${destinationName}\n✅ **Dates:** ${updatedState.dates}\n✅ **Travelers:** ${displayTravelers}\n\nI'm ready to create your personalized trip plan! This will include flights, hotels, activities, and local recommendations tailored to your preferences.`;
      
      return {
        content: confirmationMessage,
        tripPlan: null, // This will trigger the "Create Full Trip Plan" button
        conversationState: updatedState
      };
    }

    // Fallback: If user has provided destination and seems to have given details, try to detect them more aggressively
    // BUT skip this if user explicitly wants trip plan generation
    if (!isExplicitFullTripRequest && !letAIPlan && !userMessage.toLowerCase().includes('plan full trip') &&
        updatedState.destination && (contextualMessage.includes('people') || contextualMessage.includes('travelers') || contextualMessage.includes('couple') || contextualMessage.includes('solo')) && 
        (contextualMessage.includes('month') || contextualMessage.includes('week') || contextualMessage.includes('day') || contextualMessage.includes('date'))) {

      // Try to extract proper traveler count from context
      let displayTravelers = updatedState.travelers || 'your group';
      if (displayTravelers === 'travelers' || displayTravelers === 'your group') {
        // Try to extract actual number from context
        const travelerMatch = contextualMessage.match(/(\d+)\s*(?:people|person|travelers|traveler)/i);
        if (travelerMatch) {
          const count = parseInt(travelerMatch[1]);
          displayTravelers = count === 1 ? '1 person' : count + ' people';
        } else {
          // Check for other patterns
          if (contextualMessage.includes('solo') || contextualMessage.includes('alone')) {
            displayTravelers = '1 person';
          } else if (contextualMessage.includes('couple')) {
            displayTravelers = '2 people';
          } else {
            displayTravelers = '1 person'; // Default fallback
          }
        }
      }
      
      const destinationName = typeof updatedState.destination === 'string' ? updatedState.destination : (updatedState.destination as any)?.name || 'this destination';
      
      const confirmationMessage = `Perfect! I have all the details I need:\n\n✅ **Destination:** ${destinationName}\n✅ **Dates:** ${updatedState.dates || 'selected dates'}\n✅ **Travelers:** ${displayTravelers}\n\nI'm ready to create your personalized trip plan! This will include flights, hotels, activities, and local recommendations tailored to your preferences.`;
      
      return {
        content: confirmationMessage,
        tripPlan: null, // This will trigger the "Create Full Trip Plan" button
        conversationState: updatedState
      };
    }
    // If user said "plan full trip" but we don't have complete state, force it
    if (userMessage.toLowerCase().includes('plan full trip') && !updatedState.hasAllDetails) {

      updatedState.destination = updatedState.destination || 'dammam';
      updatedState.dates = updatedState.dates || 'selected dates';
      updatedState.travelers = updatedState.travelers || '1 person';
      updatedState.hasAllDetails = true;

    }
    
    // If user explicitly wants trip plan but we don't have all details, try to extract from context
    if ((isExplicitFullTripRequest || letAIPlan) && !updatedState.hasAllDetails) {

      // Try to extract missing details from the contextual message
      const contextDestination = this.extractDestination(contextualMessage);
      if (contextDestination && !updatedState.destination) {
        updatedState.destination = typeof contextDestination === 'string' ? contextDestination : (contextDestination as any)?.name;

      }
      
      // Try to extract dates from context
      const contextHasDates = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s]*\d{1,2}[-–]\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|next month|this month|next week|this week|in \d+ days?|in \d+ weeks?|in \d+ months?|tomorrow|today|yesterday|next year|this year|next \w+|this \w+|end of \w+|beginning of \w+|middle of \w+|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i.test(contextualMessage);
      if (contextHasDates && !updatedState.dates) {
        const dateMatch = contextualMessage.match(/((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]*\d{1,2}[-–]\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}|next month|this month|next week|this week)/i);
        updatedState.dates = dateMatch ? dateMatch[1] : 'selected dates';

      }
      
      // Try to extract travelers from context
      const contextHasTravelers = /\b(?:\d+\s*(?:people|person|travelers|traveler|passenger|pax)|solo|alone|couple|with.*friend|with.*family|family of \d+|group of \d+|party of \d+|me and|us|we are|i am|for \d+|traveling with|going with|accompanied by|bringing|bringing along)\b/i.test(contextualMessage);
      if (contextHasTravelers && !updatedState.travelers) {
        const travelerMatch = contextualMessage.match(/(\d+)\s*(?:people|person|travelers|traveler)/i);
        if (travelerMatch) {
          updatedState.travelers = travelerMatch[1] + ' people';
        } else {
          // Check for standalone numbers (like "2" without "people")
          const numberMatch = contextualMessage.match(/\b(\d+)\b/);
          if (numberMatch && parseInt(numberMatch[1]) >= 1 && parseInt(numberMatch[1]) <= 20) {
            const count = parseInt(numberMatch[1]);
            updatedState.travelers = count === 1 ? '1 person' : count + ' people';
          } else {
            // Check for other patterns
            const soloMatch = contextualMessage.match(/\b(solo|alone)\b/i);
            const coupleMatch = contextualMessage.match(/\b(couple)\b/i);
            const familyMatch = contextualMessage.match(/\b(family of \d+|group of \d+|party of \d+)\b/i);
            
            if (soloMatch) {
              updatedState.travelers = '1 person';
            } else if (coupleMatch) {
              updatedState.travelers = '2 people';
            } else if (familyMatch) {
              updatedState.travelers = familyMatch[1];
            } else {
              updatedState.travelers = '1 person';
            }
          }
        }

      }
      
      // Update hasAllDetails
      updatedState.hasAllDetails = !!(updatedState.destination && updatedState.dates && updatedState.travelers);

      // If details are incomplete, guide the user step-by-step and return immediately
      if (!updatedState.hasAllDetails) {
        if (!updatedState.destination) {
          return {
            content: "🌍 Where would you like to go?\n\nPlease tell me your destination, or say \"surprise me\" if you'd like me to suggest an exciting destination!\n\nExamples: \n• Tokyo\n• Paris, France\n• Maldives",
            tripPlan: undefined,
            conversationState: { ...updatedState, hasAllDetails: false }
          };
        }
        if (!updatedState.dates) {
          return {
            content: `📅 When would you like to travel to ${updatedState.destination}?\n\nYou can:\n• Click the calendar button to select dates\n• Specify dates: \"December 15-20\" or \"June 2025\"\n• Use relative time: \"next month\", \"in 2 weeks\", \"this summer\"\n• Let me decide: Say \"best time to visit\" and I'll suggest optimal dates`,
            tripPlan: undefined,
            conversationState: { ...updatedState, hasAllDetails: false }
          };
        }
        if (!updatedState.travelers) {
          return {
            content: `👥 How many people are traveling to ${updatedState.destination}?\n\nYou can:\n• Tell me the number: \"2 people\", \"family of 4\", \"solo\"\n• Describe the group: \"couple\", \"friends\", \"family with kids\"`,
            tripPlan: undefined,
            conversationState: { ...updatedState, hasAllDetails: false }
          };
        }
      }
    }
    
    const request: TripPlanRequest = { userMessage: contextualMessage, preferences };
    
    let fullResponse = '';
    
    try {
      // Generate the full trip plan - use the trip planning prompt directly

      const prompt = this.createOptimizedPrompt(request, updatedState);
      
      // Call API directly instead of going through generateTripPlan (which re-classifies)
      await this.enforceRateLimit();
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.maxTokens,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      fullResponse = data.choices[0]?.message?.content || '';
      
      this.requestCount++;

      // Parse and structure the response - handle markdown code blocks
      let jsonString = fullResponse;
      let tripPlan;
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = fullResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];

      } else {

        // Try to find JSON object in the response
        const jsonObjectMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];

        } else {

          throw new Error('No valid JSON found in API response');
        }
      }
      
      try {
        tripPlan = JSON.parse(jsonString);

      } catch (parseError) {

        throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      // Validate and fix coordinates

      const coordinateValidation = await this.validateAndFixCoordinates(tripPlan);
      if (coordinateValidation.validationResults.invalidCoordinates.length > 0) {

      }
      if (coordinateValidation.validationResults.warnings.length > 0) {

      }
      const validatedTripPlan = coordinateValidation.tripPlan;
      
      // Generate a user-friendly summary for the chat
      const chatSummary = this.generateChatSummary(validatedTripPlan);
      return { 
        content: chatSummary, 
        tripPlan: validatedTripPlan,
        conversationState: updatedState
      };
      } catch (error) {
        // Fallback: Create a basic trip plan structure
        const fallbackTripPlan = {
          destination: {
          name: this.extractDestination(contextualMessage) || "Destination Not Specified",
            country: "Various",
            coordinates: { lat: 0, lng: 0 },
          overview: "I'd love to help you plan this trip! Could you provide more details about your travel dates and the number of travelers?"
          },
          duration: "Custom",
        error: "I need a bit more information to create your perfect trip plan. Could you tell me:\n\n• When would you like to travel?\n• How many people will be traveling?\n• What's your preferred budget range?\n\nOnce I have these details, I can create a comprehensive itinerary for you!",
          itinerary: [],
          costBreakdown: {},
        insiderTips: ["Be specific about your travel dates", "Let me know how many travelers", "Share your budget preferences"]
      };
      
      return { 
        content: fallbackTripPlan.error, 
        tripPlan: fallbackTripPlan,
        conversationState: updatedState
      };
    }
  }

  /**
   * Handle general travel questions - provide short, conversational answers
   */
  private async handleTravelQuestion(userMessage: string, preferences: UserPreferences, conversationContext?: string): Promise<{
    content: string;
    tripPlan?: any;
  }> {
    // Check if this looks like a trip planning request that was misclassified
    // Be STRICT here to avoid catching generic questions like "best places to visit in X"
    const looksLikeTripPlanning = (
      /\b(?:plan|planning|help\s*me\s*plan|can\s*you\s*plan|create\s*(?:my\s*)?(?:trip|itinerary)|organize\s*trip|book\s*trip|design\s*trip)\b.*\b(?:to|for)\s+[\w\s,]+/i.test(userMessage)
      || /\b(?:trip|vacation|holiday)\s+to\s+[\w\s,]+/i.test(userMessage)
      || /\btravel\s+to\s+[\w\s,]+/i.test(userMessage)
    );
    
    if (looksLikeTripPlanning) {
      // Create personalized trip planning invitation based on user preferences
      const userContext = this.formatUserPreferences(preferences);
      const personalizedInvitation = this.createPersonalizedTripInvitation(preferences);
      
      return {
        content: `I'd love to help you plan that trip! Based on your travel profile, I can create the perfect personalized itinerary for you.\n\n${userContext}\n\n🌍 **Where would you like to go?**\n\nPlease tell me your destination, or say \"**surprise me**\" if you'd like me to suggest an exciting destination that matches your preferences!\n\n*Example: \"Tokyo\", \"Paris, France\", \"Maldives\"*\n\n${personalizedInvitation}`
      };
    }

    // For genuine travel questions, use AI to provide direct answers with full personalization
    try {
      // Build enhanced context including conversation history and user preferences
      let enhancedContext = '';
      
      if (conversationContext) {
        enhancedContext += `**Previous conversation context:**\n${conversationContext}\n\n`;
      }
      
      // Add preference-based context hints
      const preferenceHints = this.generatePreferenceHints(preferences, userMessage);
      if (preferenceHints) {
        enhancedContext += `**Personalization hints for this query:**\n${preferenceHints}\n\n`;
      }
      
      const combinedMessage = enhancedContext 
        ? `${enhancedContext}**User's question:** ${userMessage}`
        : userMessage;
        
      const response = await this.callPerplexityAPI(combinedMessage, preferences);
      return {
        content: response
      };
    } catch (error) {

      return {
        content: "I'd be happy to help with your travel question! However, I'm having trouble accessing the latest information right now. \n\n🎯 **For the best experience, let me plan your entire trip!** Just tell me:\n• Where you want to go\n• When you're traveling\n• How many people\n\nI'll create a detailed itinerary with flights, hotels, activities, and answer all your questions along the way!"
      };
    }
  }

  /**
   * Detect if destination is local/domestic or international
   */
  private detectTransportationType(destination: string, homeAirport?: string): {
    isLocal: boolean;
    transportTypes: string[];
    recommendation: string;
  } {
    if (!homeAirport) {
      return {
        isLocal: false,
        transportTypes: ['flight'],
        recommendation: 'Flight (home airport not specified)'
      };
    }

    const dest = destination.toLowerCase().trim();
    const home = homeAirport.toLowerCase().trim();
    
    // Extract country/city from destination
    const destinationParts = dest.split(/[,\s]+/);
    const lastPart = destinationParts[destinationParts.length - 1];
    
    // Common domestic patterns for major countries
    const domesticPatterns = {
      // US domestic
      'us': ['united states', 'usa', 'america', 'us'],
      'india': ['india', 'indian'],
      'uk': ['united kingdom', 'britain', 'england', 'scotland', 'wales'],
      'germany': ['germany', 'deutschland'],
      'france': ['france', 'french'],
      'spain': ['spain', 'spanish'],
      'italy': ['italy', 'italian'],
      'australia': ['australia', 'australian'],
      'canada': ['canada', 'canadian'],
      'japan': ['japan', 'japanese'],
      'china': ['china', 'chinese'],
      'brazil': ['brazil', 'brazilian'],
      'mexico': ['mexico', 'mexican']
    };

    // Extract country from home airport (assuming IATA codes or city names)
    let homeCountry = '';
    if (home.includes('us') || home.includes('america') || home.includes('united states')) {
      homeCountry = 'us';
    } else if (home.includes('in') || home.includes('india')) {
      homeCountry = 'india';
    } else if (home.includes('uk') || home.includes('london') || home.includes('britain')) {
      homeCountry = 'uk';
    } else if (home.includes('de') || home.includes('germany') || home.includes('berlin') || home.includes('munich')) {
      homeCountry = 'germany';
    } else if (home.includes('fr') || home.includes('france') || home.includes('paris')) {
      homeCountry = 'france';
    } else if (home.includes('es') || home.includes('spain') || home.includes('madrid') || home.includes('barcelona')) {
      homeCountry = 'spain';
    } else if (home.includes('it') || home.includes('italy') || home.includes('rome') || home.includes('milan')) {
      homeCountry = 'italy';
    } else if (home.includes('au') || home.includes('australia') || home.includes('sydney') || home.includes('melbourne')) {
      homeCountry = 'australia';
    } else if (home.includes('ca') || home.includes('canada') || home.includes('toronto') || home.includes('vancouver')) {
      homeCountry = 'canada';
    } else if (home.includes('jp') || home.includes('japan') || home.includes('tokyo') || home.includes('osaka')) {
      homeCountry = 'japan';
    } else if (home.includes('cn') || home.includes('china') || home.includes('beijing') || home.includes('shanghai')) {
      homeCountry = 'china';
    } else if (home.includes('br') || home.includes('brazil') || home.includes('sao paulo') || home.includes('rio')) {
      homeCountry = 'brazil';
    } else if (home.includes('mx') || home.includes('mexico') || home.includes('mexico city')) {
      homeCountry = 'mexico';
    }

    // Check if destination is domestic
    let isLocal = false;
    if (homeCountry && domesticPatterns[homeCountry as keyof typeof domesticPatterns]) {
      isLocal = domesticPatterns[homeCountry as keyof typeof domesticPatterns].some((pattern: string) => 
        dest.includes(pattern) || lastPart.includes(pattern)
      );
    }

    // Distance-based detection for major cities
    const majorCities = {
      'us': ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose'],
      'india': ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'ahmedabad', 'chennai', 'kolkata', 'pune', 'jaipur', 'lucknow'],
      'uk': ['london', 'birmingham', 'manchester', 'glasgow', 'liverpool', 'leeds', 'sheffield', 'edinburgh', 'bristol', 'leicester'],
      'germany': ['berlin', 'hamburg', 'munich', 'cologne', 'frankfurt', 'stuttgart', 'düsseldorf', 'dortmund', 'essen', 'leipzig'],
      'france': ['paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes', 'strasbourg', 'montpellier', 'bordeaux', 'lille'],
      'spain': ['madrid', 'barcelona', 'valencia', 'seville', 'zaragoza', 'málaga', 'murcia', 'palma', 'las palmas', 'bilbao'],
      'italy': ['rome', 'milan', 'naples', 'turin', 'palermo', 'genoa', 'bologna', 'florence', 'bari', 'catania'],
      'australia': ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'gold coast', 'newcastle', 'canberra', 'wollongong', 'hobart'],
      'canada': ['toronto', 'montreal', 'vancouver', 'calgary', 'edmonton', 'ottawa', 'winnipeg', 'quebec city', 'hamilton', 'kitchener'],
      'japan': ['tokyo', 'osaka', 'nagoya', 'sapporo', 'fukuoka', 'kobe', 'kyoto', 'yokohama', 'kawasaki', 'saitama'],
      'china': ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'tianjin', 'wuhan', 'dongguan', 'chengdu', 'nanjing', 'chongqing'],
      'brazil': ['são paulo', 'rio de janeiro', 'brasília', 'salvador', 'fortaleza', 'belo horizonte', 'manaus', 'curitiba', 'recife', 'porto alegre'],
      'mexico': ['mexico city', 'guadalajara', 'monterrey', 'puebla', 'tijuana', 'león', 'juárez', 'torreón', 'querétaro', 'san luis potosí']
    };

    if (homeCountry && majorCities[homeCountry as keyof typeof majorCities]) {
      const homeCity = majorCities[homeCountry as keyof typeof majorCities].find((city: string) => home.includes(city));
      const destCity = majorCities[homeCountry as keyof typeof majorCities].find((city: string) => dest.includes(city));
      
      if (homeCity && destCity && homeCity !== destCity) {
        isLocal = true; // Different cities in same country
      }
    }

    // Determine transportation types based on distance and type
    let transportTypes: string[] = [];
    let recommendation = '';

    if (isLocal) {
      // Local/domestic options
      transportTypes = ['train', 'bus', 'flight'];
      recommendation = 'Train, Bus, or Flight (domestic)';
    } else {
      // International options
      transportTypes = ['flight'];
      recommendation = 'Flight (international)';
    }

    // Special cases for very close destinations
    const veryCloseDestinations = [
      'nearby', 'local', 'close', 'near', 'adjacent', 'surrounding'
    ];
    
    if (veryCloseDestinations.some(term => dest.includes(term))) {
      transportTypes = ['bus', 'train', 'car'];
      recommendation = 'Bus, Train, or Car (very close)';
    }

    return {
      isLocal,
      transportTypes,
      recommendation
    };
  }

  /**
   * Format user preferences into personalized context
   */
  private formatUserPreferences(preferences: UserPreferences): string {
    const context = [];
    
    // Budget preferences
    if (preferences.budgetRange) {
      const budgetLevel = preferences.budgetRange.toLowerCase();
      if (budgetLevel.includes('budget') || budgetLevel.includes('low')) {
        context.push("💰 **Budget-conscious traveler** - prefers affordable options, hostels, budget airlines, free activities");
      } else if (budgetLevel.includes('luxury') || budgetLevel.includes('high')) {
        context.push("💎 **Luxury traveler** - prefers premium accommodations, first-class flights, fine dining, exclusive experiences");
      } else if (budgetLevel.includes('medium') || budgetLevel.includes('mid')) {
        context.push("⭐ **Mid-range traveler** - prefers good value accommodations, economy flights, mix of free and paid activities");
      }
    }
    
    // Travel style
    if (preferences.travelStyle) {
      const style = preferences.travelStyle.toLowerCase();
      if (style.includes('adventure') || style.includes('outdoor')) {
        context.push("🏔️ **Adventure seeker** - loves hiking, extreme sports, outdoor activities, off-the-beaten-path destinations");
      } else if (style.includes('cultural') || style.includes('history')) {
        context.push("🏛️ **Cultural explorer** - enjoys museums, historical sites, local traditions, cultural experiences");
      } else if (style.includes('relax') || style.includes('beach')) {
        context.push("🏖️ **Relaxation-focused** - prefers beach destinations, spa experiences, leisurely pace, resort stays");
      } else if (style.includes('food') || style.includes('culinary')) {
        context.push("🍽️ **Food enthusiast** - loves local cuisine, food tours, cooking classes, street food, fine dining");
      } else if (style.includes('family')) {
        context.push("👨‍👩‍👧‍👦 **Family traveler** - needs family-friendly activities, kid-safe accommodations, educational experiences");
      } else if (style.includes('solo')) {
        context.push("🧳 **Solo traveler** - prefers social hostels, group tours, safe destinations, meeting other travelers");
      } else if (style.includes('business')) {
        context.push("💼 **Business traveler** - needs reliable WiFi, central locations, efficient transport, work-friendly spaces");
      }
    }
    
    // Group travel preference
    if (preferences.groupTravelPreference) {
      const group = preferences.groupTravelPreference.toLowerCase();
      if (group.includes('solo')) {
        context.push("🧳 **Solo traveler** - prefers social hostels, group tours, safe destinations, meeting other travelers");
      } else if (group.includes('family')) {
        context.push("👨‍👩‍👧‍👦 **Family traveler** - needs family-friendly activities, kid-safe accommodations, educational experiences");
      } else if (group.includes('couple')) {
        context.push("💑 **Couple traveler** - prefers romantic destinations, intimate experiences, couple-friendly activities");
      } else if (group.includes('friends')) {
        context.push("👥 **Group traveler** - enjoys social activities, group experiences, shared adventures");
      } else if (group.includes('business')) {
        context.push("💼 **Business traveler** - needs reliable WiFi, central locations, efficient transport, work-friendly spaces");
      }
    }
    
    // Home airport
    if (preferences.homeAirport) {
      context.push(`✈️ **Departing from:** ${preferences.homeAirport} - consider flight connections and travel time`);
    }
    
    // Default currency (can indicate nationality/region)
    if (preferences.defaultCurrency) {
      context.push(`💱 **Currency preference:** ${preferences.defaultCurrency} - consider local pricing and exchange rates`);
    }
    
    // Interests (if available)
    if (preferences.interests && Array.isArray(preferences.interests) && preferences.interests.length > 0) {
      context.push(`🎯 **Interests:** ${preferences.interests.join(', ')}`);
    }
    
    // Experience priority
    if (preferences.experiencePriority) {
      const priority = preferences.experiencePriority.toLowerCase();
      if (priority.includes('culture')) {
        context.push("🏛️ **Culture-focused** - prioritizes museums, historical sites, local traditions, cultural experiences");
      } else if (priority.includes('adventure')) {
        context.push("🏔️ **Adventure-focused** - prioritizes outdoor activities, extreme sports, unique experiences");
      } else if (priority.includes('relaxation')) {
        context.push("🏖️ **Relaxation-focused** - prioritizes spa experiences, beach destinations, leisurely pace");
      } else if (priority.includes('food')) {
        context.push("🍽️ **Food-focused** - prioritizes culinary experiences, local cuisine, food tours, fine dining");
      } else if (priority.includes('nature')) {
        context.push("🌿 **Nature-focused** - prioritizes national parks, wildlife, outdoor activities, eco-tourism");
      } else if (priority.includes('history')) {
        context.push("📚 **History-focused** - prioritizes historical sites, ancient ruins, heritage locations");
      } else if (priority.includes('photography')) {
        context.push("📸 **Photography-focused** - prioritizes scenic spots, Instagram-worthy locations, photo opportunities");
      } else if (priority.includes('socializing')) {
        context.push("👥 **Social-focused** - prioritizes meeting locals, group activities, social experiences");
      }
    }
    
    return context.length > 0 ? context.join('\n') : "🌟 **General traveler** - open to various experiences and recommendations";
  }

  /**
   * Create personalized trip planning invitation based on user preferences
   */
  private createPersonalizedTripInvitation(preferences: UserPreferences): string {
    const hints = [];
    
    if (preferences.budgetRange?.toLowerCase().includes('budget')) {
      hints.push("💡 I'll focus on budget-friendly options and money-saving tips");
    } else if (preferences.budgetRange?.toLowerCase().includes('luxury')) {
      hints.push("💡 I'll recommend premium experiences and luxury accommodations");
    }
    
    if (preferences.travelStyle?.toLowerCase().includes('adventure')) {
      hints.push("🏔️ I'll include exciting outdoor activities and unique experiences");
    } else if (preferences.travelStyle?.toLowerCase().includes('cultural')) {
      hints.push("🏛️ I'll emphasize historical sites and cultural experiences");
    } else if (preferences.travelStyle?.toLowerCase().includes('food')) {
      hints.push("🍽️ I'll highlight amazing culinary experiences and local cuisine");
    } else if (preferences.travelStyle?.toLowerCase().includes('family')) {
      hints.push("👨‍👩‍👧‍👦 I'll ensure all recommendations are family-friendly");
    }
    
    if (preferences.homeAirport) {
      hints.push(`✈️ I'll consider flights from ${preferences.homeAirport}`);
    }
    
    if (preferences.defaultCurrency) {
      hints.push(`💱 I'll consider pricing in ${preferences.defaultCurrency} and local exchange rates`);
    }
    
    return hints.length > 0 
      ? `**Personalized for you:**\n${hints.join('\n')}\n\n💡 **Quick tip:** You can also say "**let AI plan everything**" and I'll create the perfect trip with optimal dates, duration, and recommendations!`
      : `💡 **Quick tip:** You can also say "**let AI plan everything**" and I'll create the perfect trip with optimal dates, duration, and recommendations!`;
  }

  /**
   * Generate specific preference hints based on the user's question
   */
  private generatePreferenceHints(preferences: UserPreferences, userMessage: string): string {
    const hints = [];
    const message = userMessage.toLowerCase();
    
    // Budget-related hints
    if (message.includes('cheap') || message.includes('budget') || message.includes('affordable')) {
      if (preferences.budgetRange?.toLowerCase().includes('luxury')) {
        hints.push("Note: User prefers luxury but asking about budget options - suggest mid-range alternatives");
      } else if (preferences.budgetRange?.toLowerCase().includes('budget')) {
        hints.push("User is budget-conscious - emphasize free/low-cost options and money-saving tips");
      }
    }
    
    // Activity-related hints
    if (message.includes('activities') || message.includes('things to do') || message.includes('attractions')) {
      if (preferences.travelStyle?.toLowerCase().includes('adventure')) {
        hints.push("User loves adventure - suggest outdoor activities, extreme sports, unique experiences");
      } else if (preferences.travelStyle?.toLowerCase().includes('cultural')) {
        hints.push("User is culturally inclined - emphasize museums, historical sites, local traditions");
      } else if (preferences.travelStyle?.toLowerCase().includes('food')) {
        hints.push("User is a foodie - highlight culinary experiences, food tours, local cuisine");
      }
    }
    
    // Accommodation hints
    if (message.includes('hotel') || message.includes('accommodation') || message.includes('stay')) {
      if (preferences.budgetRange?.toLowerCase().includes('budget')) {
        hints.push("Suggest hostels, budget hotels, and alternative accommodations");
      } else if (preferences.budgetRange?.toLowerCase().includes('luxury')) {
        hints.push("Recommend luxury hotels, resorts, and premium accommodations");
      }
    }
    
    // Transportation hints
    if (message.includes('flight') || message.includes('airline') || message.includes('transport')) {
      if (preferences.homeAirport) {
        hints.push(`Consider flights from ${preferences.homeAirport} and connection times`);
      }
      if (preferences.budgetRange?.toLowerCase().includes('budget')) {
        hints.push("Suggest budget airlines and money-saving flight tips");
      }
    }
    
    // Family-related hints
    if (message.includes('family') || message.includes('kids') || message.includes('children')) {
      if (preferences.travelStyle?.toLowerCase().includes('family')) {
        hints.push("User is family-focused - ensure all recommendations are kid-friendly and educational");
      }
    }
    
    // Solo travel hints
    if (message.includes('solo') || message.includes('alone') || message.includes('single')) {
      if (preferences.travelStyle?.toLowerCase().includes('solo')) {
        hints.push("User is solo traveler - suggest social activities, group tours, safe destinations");
      }
    }
    
    return hints.length > 0 ? hints.join('\n') : '';
  }

  /**
   * Call Perplexity API directly for general travel questions with hyperpersonalization
   */
  private async callPerplexityAPI(userMessage: string, preferences: UserPreferences): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const userContext = this.formatUserPreferences(preferences);
    
    const systemPrompt = `You are a hyperpersonalized travel assistant with access to real-time, up-to-date travel information. You provide highly customized, practical, and beautifully formatted answers to travel-related questions based on the user's specific preferences and profile.

**USER PROFILE & PREFERENCES:**
${userContext}

**RESPONSE FORMATTING REQUIREMENTS:**
- **Use rich markdown formatting** for beautiful presentation
- **Structure responses** with clear sections and headers
- **Include relevant emojis** for visual appeal and clarity
- **Use bullet points and numbered lists** for easy scanning
- **Highlight key information** with bold and italic text
- **Create visual hierarchy** with different header levels
- **Use code blocks** for specific details like prices, times, addresses
- **Include callout boxes** for important tips and warnings
- **Add visual separators** between different sections

**RESPONSE STRUCTURE TEMPLATE:**
\`\`\`markdown
# 🌍 [Main Topic/Destination]

## 📋 Quick Overview
- Brief summary of key points
- Most important information first

## 🎯 Personalized Recommendations
### [Category 1] (e.g., "Best Places to Visit")
- **Specific recommendation 1** - Brief description
- **Specific recommendation 2** - Brief description

### [Category 2] (e.g., "Where to Stay")
- **Accommodation option 1** - Price range, location, why it fits their profile
- **Accommodation option 2** - Price range, location, why it fits their profile

## 💡 Pro Tips for You
> **Personalized advice** based on their travel style and preferences

## ⚠️ Important Notes
- Visa requirements (if relevant to their passport)
- Best time to visit
- Any specific considerations for their profile

## 🔗 Quick Actions
**CRITICAL: Generate 3-5 specific, actionable quick actions based on the actual content and destination mentioned.**

**Format:** Each action should be in square brackets with specific details:
- [Book flights from [origin] to [destination]]
- [Reserve hotels in [specific city/area]]
- [Check weather in [specific location]]
- [Arrange local transport from [point A] to [point B]]
- [Check visa requirements for [specific country]]
- [Book train tickets from [origin] to [destination]]
- [View current travel prices for [destination]]

**Requirements:**
- Use actual cities/locations mentioned in the response
- Make actions specific to the content (not generic)
- Include relevant transportation options based on distance
- Add visa requirements only if international travel is mentioned
- Include weather checks for specific destinations mentioned

**Examples of good quick actions:**
- [Book flights from Delhi to Mumbai]
- [Reserve hotels in Nainital]
- [Check weather in Uttarakhand]
- [Arrange local taxi from Kathgodam to Nainital]
- [Check visa requirements for India]
- [Book train tickets from Delhi to Agra]
- [View current travel prices for Goa]
\`\`\`

**PERSONALIZATION GUIDELINES:**
- If they're budget-conscious, focus on free/low-cost options and money-saving tips
- If they're luxury travelers, recommend premium experiences and high-end accommodations
- If they're adventure seekers, suggest outdoor activities and unique experiences
- If they're cultural explorers, emphasize historical sites and local traditions
- If they're food enthusiasts, highlight culinary experiences and local cuisine
- If they're family travelers, ensure all recommendations are family-friendly
- If they're solo travelers, suggest social activities and safe destinations
- Always consider their home airport for flight recommendations
- Always check visa requirements based on their passport
- Reference their interests when suggesting activities

**VISUAL ENHANCEMENT TIPS:**
- Use emojis strategically (not excessively)
- Create visual breaks with horizontal rules (---)
- Use blockquotes for important tips
- Highlight prices and key details in code blocks
- Use tables for comparing options
- Add visual callouts for warnings or special notes

Answer the user's travel question with maximum personalization and beautiful formatting based on their profile.`;

    // Create personalized user message with context
    const personalizedMessage = `${userMessage}\n\n**Please personalize your response based on my travel profile above.**`;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: personalizedMessage
          }
        ],
        max_tokens: 2500, // Increased for more detailed personalized responses
        temperature: 0.4, // Slightly higher for more creative personalization
        top_p: 0.9,
        return_citations: true,
        search_recency_filter: 'month'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Generate a user-friendly chat summary from the trip plan
   */
  private generateChatSummary(tripPlan: any): string {
    try {
      // If we have a structured trip plan, create a nice summary
      if (tripPlan && typeof tripPlan === 'object' && tripPlan.destination) {
        const dest = tripPlan.destination;
        const destName = typeof dest === 'string' ? dest : dest.name || 'Your Destination';
        const country = typeof dest === 'object' && dest.country ? `, ${dest.country}` : '';
        const duration = tripPlan.duration || 'Custom duration';
        const totalCost = tripPlan.costBreakdown?.total || 'Budget flexible';
        
        let summary = `✈️ **Trip Plan Generated for ${destName}${country}**\n\n`;
        
        // Add key details
        summary += `📅 **Duration:** ${duration}\n`;
        summary += `💰 **Estimated Budget:** ${totalCost}\n\n`;
        
        // Add highlights if available
        if (dest.highlights && Array.isArray(dest.highlights) && dest.highlights.length > 0) {
          summary += `🌟 **Key Highlights:**\n`;
          dest.highlights.slice(0, 3).forEach((highlight: string) => {
            summary += `• ${highlight}\n`;
          });
          summary += `\n`;
        }
        
        // Add itinerary preview if available
        if (tripPlan.itinerary && Array.isArray(tripPlan.itinerary) && tripPlan.itinerary.length > 0) {
          summary += `📋 **Itinerary Preview:**\n`;
          tripPlan.itinerary.slice(0, 2).forEach((day: any, index: number) => {
            summary += `**Day ${day.day || index + 1}:** ${day.title || 'Planned activities'}\n`;
          });
          if (tripPlan.itinerary.length > 2) {
            summary += `... and ${tripPlan.itinerary.length - 2} more days\n`;
          }
          summary += `\n`;
        }
        
        summary += `🎯 **Your comprehensive trip plan includes:**\n`;
        summary += `• ✈️ Flight recommendations and details\n`;
        summary += `• 🏨 Accommodation suggestions\n`;
        summary += `• 🍽️ Food and restaurant guides\n`;
        summary += `• 🚗 Transportation options\n`;
        summary += `• 💡 Insider tips and packing lists\n`;
        summary += `• 💰 Detailed cost breakdown\n\n`;
        
        summary += `*Click "View Full Trip Plan" below to explore all details in an interactive format!*`;
        
        return summary;
      }
    } catch (error) {

    }
    
    // Fallback to a simple message
    return `🎯 **Trip Plan Generated!**\n\nI've created a comprehensive travel plan for your request. Click "View Full Trip Plan" below to explore all the details including flights, accommodation, itinerary, food recommendations, and more!\n\n*Your personalized trip plan is ready to view.*`;
  }

  /**
   * Main method to handle all types of travel-related queries
   */
  async generateTripPlan(request: TripPlanRequest): Promise<string> {
    // First, classify the user's query
    const classification = this.classifyQuery(request.userMessage);
    // Handle non-travel queries immediately
    if (classification.type === 'non_travel') {

      return this.handleNonTravelQuery(request.userMessage, classification.reason);
    }
    
    // Handle travel questions vs full trip planning
    const isFullTripPlan = classification.type === 'trip_planning';
    const prompt = isFullTripPlan 
      ? this.createOptimizedPrompt(request)
      : this.createTravelQuestionPrompt(request);

    // If no API key, throw an error to ensure real AI data is used
    if (!this.apiKey) {
      throw new Error('API key not configured. Please configure your VITE_SONAR_API_KEY environment variable to use the AI trip planner.');
    }

    try {
      // Enforce rate limiting to control costs
      await this.enforceRateLimit();

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'sonar', // Use the same model as other components
          messages: [
            {
              role: 'system',
              content: isFullTripPlan 
                ? 'You are a travel planning expert with access to real-time travel data and current market prices.\n\nCRITICAL JSON FORMATTING - MUST FOLLOW EXACTLY:\n1. Return ONLY valid JSON - NO markdown, NO code blocks (no ```json), NO explanatory text\n2. Start response with { and end with }\n3. Every property MUST have format: "propertyName": "value" or "propertyName": number\n4. Strings MUST be in double quotes\n5. Numbers (coordinates, prices without symbols) should NOT be in quotes\n6. Use commas between properties, but NO trailing commas before } or ]\n7. For nested objects: "property": { "nested": "value" }\n8. For arrays: "property": ["item1", "item2"]\n\nCOMMON MISTAKES TO AVOID:\n❌ "name": "Bali", "country": "Indonesia" ← Missing property name\n✅ "name": "Bali", "country": "Indonesia" ← Correct\n\n❌ "lat": "-8.3405" ← Coordinates should be numbers\n✅ "lat": -8.3405 ← Correct\n\n❌ "price": ₹18,500 ← No currency symbol in raw value\n✅ "price": "₹18,500" ← Correct (as string with symbol)\n\n❌ "url": "https://", "domain": "www.example.com" ← Split URL\n✅ "url": "https://www.example.com" ← Correct\n\n❌ "date": "2025-10-15", "T03":30+05:30" ← Split datetime\n✅ "date": "2025-10-15T03:30+05:30" ← Correct\n\nDATA ACCURACY REQUIREMENTS:\n- Provide REAL, CURRENT prices from actual sources\n- Research current market rates for flights, hotels, activities\n- Use specific airline names, hotel names, restaurant names\n- Include exact coordinates (lat/lng as numbers without quotes)\n- Base all prices on user\'s preferred currency\n- Include booking URLs and references\n- Ensure all prices reflect real-world availability\n\nYour response must be a single, complete, valid JSON object. Test your JSON before returning!'
                : 'You are SkyNeu, a specialized AI travel assistant. Provide helpful, accurate travel advice in a conversational format. Focus on practical information and actionable recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.maxTokens,
          temperature: 0.2, // Lower temperature for more consistent coordinate data
          // Additional cost optimization parameters
          top_p: 0.9,
          frequency_penalty: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.usage) {
        const tokenCost = data.usage.total_tokens * 0.0005; // Approximate cost per 1K tokens
        const sessionCost = this.requestCount * tokenCost;
        // Alert if approaching cost limits
        if (sessionCost > 0.50) {

        }
        
        if (this.requestCount > 20) {

        }
      }

      const aiResponse = data.choices[0]?.message?.content || 'Failed to generate response';
      
      // RAW CONSOLE LOG - Let's see exactly what the API returns

      // Handle different response types based on query classification
      if (isFullTripPlan) {
        // For trip planning, expect JSON response

        // CRITICAL: Try to parse the raw response first before any preprocessing
        try {

          const parsed = JSON.parse(aiResponse);

          // Validate and fix coordinates
          const coordinateValidation = await this.validateAndFixCoordinates(parsed);
          const validatedTripPlan = coordinateValidation.tripPlan;
          
          // Validate and fix pricing calculations
          const pricingValidatedTripPlan = this.validateAndFixPricing(validatedTripPlan);
          
          // No need to convert costs - Perplexity provides prices in user's preferred currency

          return JSON.stringify(pricingValidatedTripPlan, null, 2);
        } catch (directParseError) {

          // MINIMAL extraction - just get the JSON object
          let cleanResponse = aiResponse.trim();
          
          // Only extract JSON if it's wrapped in markdown
          if (cleanResponse.includes('```json')) {
            const jsonMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              cleanResponse = jsonMatch[1].trim();
            }
          } else if (cleanResponse.includes('```')) {
            const jsonMatch = cleanResponse.match(/```\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              cleanResponse = jsonMatch[1].trim();
            }
          }
          
          // Extract just the JSON object
          const jsonStart = cleanResponse.indexOf('{');
          const jsonEnd = cleanResponse.lastIndexOf('}');
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
          }

        // Validate that it's proper JSON before returning
        try {

            const parsed = JSON.parse(cleanResponse);

            // Validate and fix coordinates
            const coordinateValidation = await this.validateAndFixCoordinates(parsed);
            const validatedTripPlan = coordinateValidation.tripPlan;
            
            // Validate and fix pricing calculations
            const pricingValidatedTripPlan = this.validateAndFixPricing(validatedTripPlan);
            
            // No need to convert costs - Perplexity provides prices in user's preferred currency

            return JSON.stringify(pricingValidatedTripPlan, null, 2);
        } catch (parseError) {

            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);

            // Show the exact character at the error position if available
            const positionMatch = errorMessage.match(/position (\d+)/);
            if (positionMatch) {
            }
            
            // Try one more time with aggressive cleanup
            try {

              const aggressivelyCleaned = this.aggressiveJSONCleanup(cleanResponse);

              const parsed = JSON.parse(aggressivelyCleaned);

              // Validate and fix coordinates
              const coordinateValidation = await this.validateAndFixCoordinates(parsed);
              const validatedTripPlan = coordinateValidation.tripPlan;
              
              // Validate and fix pricing calculations
              const pricingValidatedTripPlan = this.validateAndFixPricing(validatedTripPlan);
              
              // No need to convert costs - Perplexity provides prices in user's preferred currency

              return JSON.stringify(pricingValidatedTripPlan, null, 2);
            } catch (finalError) {

              // Check if the response is incomplete (truncated)
              if (aiResponse.includes('"acti') || aiResponse.includes('"time": "2:00 PM"')) {

                const completedResponse = this.completeIncompleteResponse(aiResponse);
                try {
                  const completedTripPlan = JSON.parse(completedResponse);

                  return JSON.stringify(completedTripPlan, null, 2);
                } catch (completionError) {

                }
              }
              
              // Return a basic structure with the AI's text response
              const fallbackPlan = {
                destination: {
                  name: this.extractDestination(request.userMessage) || "Destination Not Specified",
                  country: "Various",
                  coordinates: { lat: 0, lng: 0 },
                  overview: "AI response could not be properly formatted. Please try again with a simpler request."
                },
                duration: "Custom",
                fullResponse: aiResponse, // This will be displayed in the modal
                error: "The AI response could not be parsed into the expected format. Try asking for a simpler trip plan or be more specific about your destination.",
                itinerary: [],
                costBreakdown: {},
                insiderTips: ["Please try rephrasing your request", "Be specific about destination and duration", "Try one destination at a time"]
              };
              
              return JSON.stringify(fallbackPlan, null, 2);
            }
          }
        }
      } else {
        // For travel questions, return text response directly
        return aiResponse;
      }

    } catch (error) {

      throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  }

  /**
   * Parse traveler count from various formats
   */
  private parseTravelerCount(travelersRaw: any): number {
    if (typeof travelersRaw === 'number') {
      return travelersRaw;
    }
    
    if (typeof travelersRaw === 'string') {
      // Extract number from strings like "2 people", "1 person", etc.
      const numberMatch = travelersRaw.match(/(\d+)/);
      if (numberMatch) {
        return parseInt(numberMatch[1]);
      }
      
      // Check for specific patterns
      if (travelersRaw.toLowerCase().includes('solo') || travelersRaw.toLowerCase().includes('alone')) {
        return 1;
      }
      if (travelersRaw.toLowerCase().includes('couple')) {
        return 2;
      }
      if (travelersRaw.toLowerCase().includes('family')) {
        return 4; // Default family size
      }
    }
    
    return 1; // Default fallback
  }

  /**
   * Extract budget information from AI trip plan response
   */
  extractBudgetFromTripPlan(tripPlanJson: any, preferredCurrency: string = 'USD'): {
    totalBudget: number;
    currency: string;
    budgetBreakdown: {
      flights: number;
      accommodation: number;
      food: number;
      activities: number;
      transportation: number;
      miscellaneous: number;
    };
  } | null {
    try {
      if (!tripPlanJson || !tripPlanJson.costBreakdown) {
        return null;
      }

      const costBreakdown = tripPlanJson.costBreakdown;
      const summary = costBreakdown.summary || {};
      
      // Extract total cost
      const totalCost = this.extractNumericValue(summary.totalCost) || 
                       this.extractNumericValue(costBreakdown.total) || 0;
      
      // Extract currency - use preferred currency if available, otherwise fallback to AI response
      const currency = summary.currency || preferredCurrency;
      
      // Extract individual costs
      const budgetBreakdown = {
        flights: this.extractNumericValue(costBreakdown.flights?.total) || 0,
        accommodation: this.extractNumericValue(costBreakdown.accommodation?.total) || 0,
        food: this.extractNumericValue(costBreakdown.food?.total) || 0,
        activities: this.extractNumericValue(costBreakdown.activities?.total) || 0,
        transportation: this.extractNumericValue(costBreakdown.transportation?.total) || 0,
        miscellaneous: this.extractNumericValue(costBreakdown.miscellaneous?.total) || 0,
      };

      return {
        totalBudget: totalCost,
        currency,
        budgetBreakdown
      };
    } catch (error) {

      return null;
    }
  }

  /**
   * Validate and convert trip plan costs to user's preferred currency
   */
  async validateAndConvertCosts(
    tripPlan: any, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<any> {
    try {

      // If currencies are the same, return as-is
      if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {

        return tripPlan;
      }

      // Convert cost breakdown
      if (tripPlan.costBreakdown) {

        tripPlan.costBreakdown = await currencyConversionService.convertCostBreakdown(
          tripPlan.costBreakdown,
          fromCurrency,
          toCurrency
        );

      }

      // Convert individual costs in activities
      if (tripPlan.itinerary && Array.isArray(tripPlan.itinerary)) {
        for (const day of tripPlan.itinerary) {
          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              if (activity.cost && typeof activity.cost === 'string') {
                const numericCost = this.extractNumericValue(activity.cost);
                if (numericCost > 0) {
                  const converted = await currencyConversionService.convert(
                    numericCost,
                    fromCurrency,
                    toCurrency
                  );
                  activity.cost = converted.formatted;
                }
              }
            }
          }
        }
      }

      // Convert accommodation costs
      if (tripPlan.accommodation) {
        if (tripPlan.accommodation.pricePerNight) {
          const numericCost = this.extractNumericValue(tripPlan.accommodation.pricePerNight);
          if (numericCost > 0) {
            const converted = await currencyConversionService.convert(
              numericCost,
              fromCurrency,
              toCurrency
            );
            tripPlan.accommodation.pricePerNight = converted.formatted;

          }
        }
        if (tripPlan.accommodation.totalPrice) {
          const numericCost = this.extractNumericValue(tripPlan.accommodation.totalPrice);
          if (numericCost > 0) {
            const converted = await currencyConversionService.convert(
              numericCost,
              fromCurrency,
              toCurrency
            );
            tripPlan.accommodation.totalPrice = converted.formatted;

          }
        }
      }

      // Convert flight costs
      if (tripPlan.flights) {
        if (tripPlan.flights.outbound?.price) {
          const numericCost = this.extractNumericValue(tripPlan.flights.outbound.price);
          if (numericCost > 0) {
            const converted = await currencyConversionService.convert(
              numericCost,
              fromCurrency,
              toCurrency
            );
            tripPlan.flights.outbound.price = converted.formatted;

          }
        }
        if (tripPlan.flights.return?.price) {
          const numericCost = this.extractNumericValue(tripPlan.flights.return.price);
          if (numericCost > 0) {
            const converted = await currencyConversionService.convert(
              numericCost,
              fromCurrency,
              toCurrency
            );
            tripPlan.flights.return.price = converted.formatted;

          }
        }
      }

      return tripPlan;
    } catch (error) {

      return tripPlan; // Return original if conversion fails
    }
  }

  /**
   * Validate and fix coordinates in trip plan
   */
  async validateAndFixCoordinates(tripPlan: any): Promise<{
    tripPlan: any;
    validationResults: {
      validCoordinates: any[];
      invalidCoordinates: any[];
      warnings: string[];
    };
  }> {
    try {
      const validationResults = coordinateValidationService.validateTripPlanCoordinates(tripPlan);
      
      // Fix invalid coordinates by geocoding place names
      for (const invalid of validationResults.invalidCoordinates) {

        // Try to find the place in the trip plan and geocode it
        const geocoded = await coordinateValidationService.validateAndGeocodePlace(invalid.name);
        
        if (geocoded.isValid && geocoded.coordinates) {
          // Update the trip plan with valid coordinates
          this.updateCoordinatesInTripPlan(tripPlan, invalid.name, geocoded.coordinates);

      } else {

        }
      }

      return {
        tripPlan,
        validationResults
      };
    } catch (error) {

      return {
        tripPlan,
        validationResults: {
          validCoordinates: [],
          invalidCoordinates: [],
          warnings: ['Coordinate validation failed']
        }
      };
    }
  }

  /**
   * Validate and fix pricing calculations in the trip plan
   */
  private validateAndFixPricing(tripPlan: any): any {
    try {

      // Extract traveler count with robust parsing
      const travelersRaw = tripPlan.travelers || tripPlan.numberOfTravelers || 1;
      const travelers = this.parseTravelerCount(travelersRaw);

      // Fix hotel total price calculation
      if (tripPlan.accommodation?.primary) {
        const hotel = tripPlan.accommodation.primary;
        if (hotel.pricePerNight && hotel.totalPrice) {
          const pricePerNight = this.extractNumericValue(hotel.pricePerNight);
          const totalPrice = this.extractNumericValue(hotel.totalPrice);
          
          // Calculate expected total price based on duration and travelers
          const duration = tripPlan.duration || '5 days';
          const nights = parseInt(duration.replace(/\D/g, '')) || 5;
          
          // Check if price is per person or per room
          const isPerPerson = hotel.pricePerNight.toLowerCase().includes('per person') || 
                             hotel.pricePerNight.toLowerCase().includes('pp') ||
                             hotel.pricePerNight.toLowerCase().includes('per traveler') ||
                             hotel.pricePerNight.toLowerCase().includes('per guest');
          
          // Calculate expected total based on pricing model
          let expectedTotal;
          if (isPerPerson) {
            expectedTotal = pricePerNight * nights * travelers;
          } else {
            // For per-room pricing, calculate rooms needed based on travelers
            const roomsNeeded = Math.ceil(travelers / 2); // Assume 2 people per room
            expectedTotal = pricePerNight * nights * roomsNeeded;
          }

          // Validate that the current total price is reasonable
          const isReasonablePrice = totalPrice > 0 && totalPrice < 100000; // Less than 100k (more reasonable for hotel costs)
          const needsRecalculation = Math.abs(totalPrice - expectedTotal) > 100; // Allow small difference for rounding
          const isSuspiciouslyHigh = totalPrice > 500000; // More than 5 lakhs is definitely wrong
          
          if (!isReasonablePrice || needsRecalculation || isSuspiciouslyHigh) {

            // Replace the entire price with proper formatting
            const currency = hotel.totalPrice.includes('₹') ? '₹' : hotel.totalPrice.includes('$') ? '$' : '₹';
            hotel.totalPrice = `${currency}${expectedTotal.toLocaleString()}`;
          }
        }
      }
      
      // Fix flight total cost calculation
      if (tripPlan.flights?.outbound?.price && tripPlan.flights?.return?.price) {
        const outboundPrice = this.extractNumericValue(tripPlan.flights.outbound.price);
        const returnPrice = this.extractNumericValue(tripPlan.flights.return.price);
        const totalFlightCost = (outboundPrice + returnPrice) * travelers;
        
        if (tripPlan.flights.totalFlightCost) {
          const currentTotal = this.extractNumericValue(tripPlan.flights.totalFlightCost);
          if (Math.abs(currentTotal - totalFlightCost) > 100) {

            // Replace the entire price with proper formatting
            const currency = tripPlan.flights.totalFlightCost.includes('₹') ? '₹' : tripPlan.flights.totalFlightCost.includes('$') ? '$' : '₹';
            tripPlan.flights.totalFlightCost = `${currency}${totalFlightCost.toLocaleString()}`;
          }
        } else {
          tripPlan.flights.totalFlightCost = `₹${totalFlightCost.toLocaleString()}`;
        }
      }
      
      // Fix cost breakdown total and ensure all costs are per-traveler
      if (tripPlan.costBreakdown) {
        const breakdown = tripPlan.costBreakdown;
        
        // Ensure all costs in breakdown are calculated for the correct number of travelers
        const flightsCost = this.extractNumericValue(breakdown.flights || '0');
        const accommodationCost = this.extractNumericValue(breakdown.accommodation || '0');
        const foodCost = this.extractNumericValue(breakdown.food || '0');
        const activitiesCost = this.extractNumericValue(breakdown.activities || '0');
        const transportationCost = this.extractNumericValue(breakdown.transportation || '0');
        const miscellaneousCost = this.extractNumericValue(breakdown.miscellaneous || '0');
        
        // Calculate total from individual costs
        const total = flightsCost + accommodationCost + foodCost + activitiesCost + transportationCost + miscellaneousCost;

        if (breakdown.total) {
          const currentTotal = this.extractNumericValue(breakdown.total);
          if (Math.abs(currentTotal - total) > 100) {

            // Replace the entire price with proper formatting
            const currency = breakdown.total.includes('₹') ? '₹' : breakdown.total.includes('$') ? '$' : '₹';
            breakdown.total = `${currency}${total.toLocaleString()}`;
          }
        } else {
          breakdown.total = `₹${total.toLocaleString()}`;
        }
      }
      
      // Fix activity costs to ensure they're calculated per traveler
      if (tripPlan.itinerary && Array.isArray(tripPlan.itinerary)) {
        for (const day of tripPlan.itinerary) {
          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              if (activity.cost) {
                const activityCost = this.extractNumericValue(activity.cost);
                if (activityCost > 0) {
                  // Check if cost is per person or total
                  const isPerPerson = activity.cost.toString().toLowerCase().includes('per person') ||
                                    activity.cost.toString().toLowerCase().includes('pp') ||
                                    activity.cost.toString().toLowerCase().includes('per traveler');
                  
                  if (!isPerPerson) {
                    // If not specified as per person, assume it's per person and multiply by travelers
                    const totalCost = activityCost * travelers;
                    const currency = activity.cost.includes('₹') ? '₹' : activity.cost.includes('$') ? '$' : '₹';
                    activity.cost = `${currency}${totalCost.toLocaleString()} (for ${travelers} travelers)`;

                  }
                }
              }
            }
          }
        }
      }

      return tripPlan;
    } catch (error) {

      return tripPlan;
    }
  }

  /**
   * Update coordinates in trip plan for a specific place
   */
  private updateCoordinatesInTripPlan(tripPlan: any, placeName: string, coordinates: { lat: number; lng: number }): void {
    // Update destination coordinates
    if (tripPlan.destination?.name === placeName) {
      tripPlan.destination.coordinates = coordinates;
    }

    // Update accommodation coordinates
    if (tripPlan.accommodation?.name === placeName) {
      tripPlan.accommodation.coordinates = coordinates;
    }

    // Update activity coordinates
    if (tripPlan.itinerary && Array.isArray(tripPlan.itinerary)) {
      for (const day of tripPlan.itinerary) {
        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            if (activity.activity === placeName || activity.location === placeName) {
              activity.coordinates = coordinates;
            }
          }
        }
      }
    }

    // Update restaurant coordinates
    if (tripPlan.foodGuide?.recommendedRestaurants && Array.isArray(tripPlan.foodGuide.recommendedRestaurants)) {
      for (const restaurant of tripPlan.foodGuide.recommendedRestaurants) {
        if (restaurant.name === placeName) {
          restaurant.coordinates = coordinates;
        }
      }
    }
  }

  /**
   * Extract numeric value from string (e.g., "$500" -> 500)
   */
  private extractNumericValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Handle various currency formats including lakhs, crores, etc.
      let cleaned = value.toString();

      // Convert lakhs to standard numbers (1 lakh = 100,000)
      cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*lakhs?/gi, (_, num) => {
        const val = parseFloat(num) * 100000;

        return val.toString();
      });
      
      // Convert crores to standard numbers (1 crore = 10,000,000)
      cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*crores?/gi, (_, num) => {
        const val = parseFloat(num) * 10000000;

        return val.toString();
      });
      
      // Convert thousands to standard numbers
      cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*thousands?/gi, (_, num) => {
        const val = parseFloat(num) * 1000;

        return val.toString();
      });

      // Extract numeric value (including commas and decimals)
      const match = cleaned.match(/[\d,]+\.?\d*/);
      const result = match ? parseFloat(match[0].replace(/,/g, '')) : 0;

      // Add validation to prevent extremely high values
      if (result > 10000000) { // More than 1 crore

        return 0; // Return 0 for suspicious values
      }
      
      // Additional validation for hotel prices (should be reasonable)
      if (result > 1000000) { // More than 10 lakhs

        // Try to extract a more reasonable value by looking for patterns
        const reasonableMatch = value.match(/(\d{1,2})[,\d]*\.?\d*/);
        if (reasonableMatch) {
          const reasonableValue = parseFloat(reasonableMatch[1]) * 1000; // Assume it's in thousands

          return reasonableValue;
        }
      }
      
      return result;
    }
    return 0;
  }

  /**
   * Analyze budget with Sonar AI (placeholder method)
   */
  async analyzeBudgetWithSonar(
    budget: number,
    activities: any[],
    expenses: any[],
    _destination: string
  ): Promise<{
    utilizationPercentage: number;
    categoryBreakdown: Record<string, number>;
    recommendations: string[];
  }> {
    // This is a placeholder method - the actual implementation would use Sonar AI
    // For now, return basic analysis based on all activities and expenses
    const userActivitySpent = activities
      .reduce((sum, a) => sum + (a.cost || 0), 0);
    const userExpenseSpent = expenses
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalUserSpent = userActivitySpent + userExpenseSpent;
    const utilizationPercentage = budget ? (totalUserSpent / budget) * 100 : 0;
    
    // Combine activity and expense categories (include all)
    const categoryBreakdown = activities
      .reduce((acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + (a.cost || 0);
        return acc;
      }, {} as Record<string, number>);

    // Add expenses to category breakdown
    expenses
      .forEach(e => {
        const category = e.category || 'Other';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (e.amount || 0);
      });

    return {
      utilizationPercentage,
      categoryBreakdown,
      recommendations: [
        'Track expenses to stay on budget',
        'Compare prices before booking',
        'Keep emergency fund reserve',
        'Look for free local activities'
      ]
    };
  }

  /**
   * Extract destination from user message
   */
  private extractDestination(userMessage: string): string | null {
    try {
      // Common destination patterns - more specific
      const patterns = [
        /plan\s+a\s+trip\s+to\s+([A-Za-z][a-zA-Z\s,]+?)(?:\s+for|\s+from|\s+with|\s+in|\s*$)/i,
        /trip\s+to\s+([A-Za-z][a-zA-Z\s,]+?)(?:\s+for|\s+from|\s+with|\s+in|\s*$)/i,
        /travel\s+to\s+([A-Za-z][a-zA-Z\s,]+?)(?:\s+for|\s+from|\s+with|\s+in|\s*$)/i,
        /(?:visit|go to)\s+([A-Z][a-zA-Z\s,]+?)(?:\s+for|\s+from|\s+with|\s+in|\s+on|\s*$|,|\.|!|\?)/i,
        /(?:destination|place|location)\s*:?\s*([A-Z][a-zA-Z\s,]+?)(?:\s|$|,|\.|!|\?)/i,
        /(?:vacation in|holiday in)\s+([A-Z][a-zA-Z\s,]+?)(?:\s|$|,|\.|!|\?)/i,
        /^([A-Za-z][a-zA-Z\s,]+?)$/ // Simple destination name like "dammam"
      ];
      
      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          let destination = match[1].trim();
          // Remove trailing prepositions and common words
          destination = destination.replace(/\s+(for|from|with|in|on|the|a|an)$/i, '').trim();
          
          // Filter out common words that aren't destinations
          const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'by', 'me', 'us', 'you', 'they', 'trip', 'travel', 'plan', 'planning', 'my', 'our', 'skyneu'];
          if (!commonWords.includes(destination.toLowerCase()) && destination.length > 2) {

            return destination;
          }
        }
      }

      return null; // Return null instead of fallback
    } catch (error) {

      return null; // Return null on error
    }
  }

  /**
   * Complete incomplete AI responses (when response is truncated)
   */
  private completeIncompleteResponse(response: string): string {
    let completed = response;
    
    // Find the last complete activity or property
    const lastCompleteActivity = completed.lastIndexOf('"activity":');
    if (lastCompleteActivity > 0) {
      // Find the end of the last complete activity
      const endOfActivity = completed.indexOf('"', lastCompleteActivity + 20);
      if (endOfActivity > 0) {
        // Close the current activity
        completed = completed.substring(0, endOfActivity + 1) + '}';
      }
    }
    
    // Handle incomplete strings at the end
    if (completed.endsWith('"') || completed.endsWith('",') || completed.endsWith('":')) {
      // Find the last complete property
      const lastCompleteProperty = completed.lastIndexOf('",');
      if (lastCompleteProperty > 0) {
        completed = completed.substring(0, lastCompleteProperty + 1);
      }
    }
    
    // Close all open objects and arrays
    const openBraces = (completed.match(/{/g) || []).length;
    const closeBraces = (completed.match(/}/g) || []).length;
    const openBrackets = (completed.match(/\[/g) || []).length;
    const closeBrackets = (completed.match(/]/g) || []).length;
    
    // Add missing closing brackets
    if (openBrackets > closeBrackets) {
      completed += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // Add missing closing braces
    if (openBraces > closeBraces) {
      completed += '}'.repeat(openBraces - closeBraces);
    }
    
    return completed;
  }

  /**
   * Aggressive JSON cleanup as last resort - REMOVED (too destructive)
   * Now just returns the input as-is and relies on fallback handling
   */
  private aggressiveJSONCleanup(jsonString: string): string {
    // Don't do aggressive cleanup - it breaks more than it fixes
    // Just return as-is and let the fallback trip plan handle it

    return jsonString;
  }

}

// Export as default instance
const aiTripPlanningService = new AITripPlanningService();
export default aiTripPlanningService;
