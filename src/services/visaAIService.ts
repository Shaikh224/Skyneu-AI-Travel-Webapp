/**
 * AI-Powered Visa Service using Sonar API
 * Provides dynamic, context-aware visa information with personalized insights
 * Features: Real-time data, caching, currency conversion, mobile optimization
 */

// Enhanced caching interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Currency conversion interface
interface CurrencyRates {
  [key: string]: number;
}

// Cache storage
class VisaCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.DEFAULT_TTL);
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  isStale(key: string, threshold: number = 5 * 60 * 1000): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > threshold;
  }
}

// Global cache instance
const visaCache = new VisaCache();

export interface VisaRequirement {
  country: string;
  countryCode: string;
  flag: string;
  requirement: 'visa-free' | 'visa-required' | 'visa-on-arrival' | 'eta-required';
  maxStay: string;
  processingTime?: string;
  cost?: string;
  documents: string[];
  officialLinks?: string[];
  embassyInfo?: EmbassyInfo;
  riskAssessment?: RiskAssessment;
  alternatives?: VisaAlternative[];
  costBreakdown?: CostBreakdown;
  smartAlerts?: SmartAlert[];
  aiInsights: {
    difficulty: 'easy' | 'moderate' | 'complex';
    successRate: number;
    tips: string[];
    warnings?: string[];
    personalizedAdvice?: string[];
  };
  recentChanges?: string;
}

export interface EmbassyInfo {
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  appointments: {
    waitTime: string;
    bookingUrl: string;
    requirements: string[];
  };
  localHours: string;
  holidaySchedule?: string[];
}

export interface RiskAssessment {
  approvalChance: number;
  riskFactors: string[];
  mitigation: string[];
  strengthFactors: string[];
  recommendedApproach: string;
}

export interface VisaAlternative {
  type: 'visa-free-country' | 'transit-route' | 'different-visa-type';
  title: string;
  description: string;
  countries?: string[];
  savings?: string;
  requirements?: string[];
}

export interface CostBreakdown {
  visaFee: number;
  biometrics: number;
  courier: number;
  healthInsurance?: number;
  translation?: number;
  photos: number;
  otherFees: number;
  total: number;
  currency: string;
  hiddenCosts: string[];
  convertedTotal?: number;
  userCurrency?: string;
  exchangeNote?: string;
  convertedFees?: {
    visaFee: number;
    biometrics: number;
    courier: number;
    healthInsurance?: number;
    translation?: number;
    photos: number;
    otherFees: number;
  };
}

export interface SmartAlert {
  id: string;
  type: 'deadline' | 'policy-change' | 'embassy-closure' | 'document-expiry' | 'appointment-available';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  dueDate?: string;
  notificationDate: string;
}

export interface TravelerProfile {
  nationality: string;
  passportExpiry?: string;
  visaHistory: string[];
  travelPurpose: string;
  previousRefusals?: string[];
  currentLocation: string;
  hasSchengenHistory: boolean;
  isStudent: boolean;
  employmentStatus: string;
  financialStatus: string;
}

export interface VisaContext {
  traveler: TravelerProfile;
  destination: string;
  travelDate: string;
  stayDuration: string;
  accompaniedBy?: string;
  tripType: 'first-time' | 'return' | 'frequent';
}

class VisaAIService {
  private sonarApiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  private currencyRates: CurrencyRates = {};
  private lastCurrencyUpdate = 0;

  constructor() {
    this.sonarApiKey = import.meta.env.VITE_SONAR_API_KEY || '';
    
    if (!this.sonarApiKey) {
      console.warn('⚠️ Sonar API key not configured - visa intelligence will be limited');
    }
    
    // Initialize currency rates on startup
    this.initializeCurrencyRates();
  }

  /**
   * Initialize currency rates on service startup
   */
  private async initializeCurrencyRates(): Promise<void> {
    try {
      await this.updateCurrencyRates();
    } catch (error) {
      console.warn('Failed to initialize currency rates on startup:', error);
      this.setFallbackRates(); // Use fallback rates if initial load fails
    }
  }

  /**
   * Get user's location and currency based on IP
   */
  async getUserLocationInfo(): Promise<{ country: string; currency: string; countryCode: string }> {
    const cacheKey = 'user-location';
    const cached = visaCache.get<{ country: string; currency: string; countryCode: string }>(cacheKey);
    
    if (cached && !visaCache.isStale(cacheKey, 60 * 60 * 1000)) { // 1 hour cache
      return cached;
    }

    try {
      // Use free IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const locationInfo = {
        country: data.country_name || 'United States',
        currency: data.currency || 'USD',
        countryCode: data.country_code || 'US'
      };

      visaCache.set(cacheKey, locationInfo, 60 * 60 * 1000); // Cache for 1 hour
      return locationInfo;
    } catch (error) {
      console.warn('Could not detect location, using defaults:', error);
      return { country: 'United States', currency: 'USD', countryCode: 'US' };
    }
  }

  /**
   * Convert cost to user's home currency
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    try {
      // Check if we need to update currency rates (every 4 hours)
      const now = Date.now();
      if (now - this.lastCurrencyUpdate > 4 * 60 * 60 * 1000 || Object.keys(this.currencyRates).length === 0) {
        await this.updateCurrencyRates();
      }

      // Try direct conversion first
      let rate = this.currencyRates[`${fromCurrency}_${toCurrency}`];
      
      // If direct rate not available, convert via USD
      if (!rate) {
        const fromToUsd = this.currencyRates[`${fromCurrency}_USD`] || (fromCurrency === 'USD' ? 1 : 0);
        const usdToTarget = this.currencyRates[`USD_${toCurrency}`] || (toCurrency === 'USD' ? 1 : 0);
        
        if (fromToUsd && usdToTarget) {
          rate = fromToUsd * usdToTarget;
        }
      }

      // Fallback: if still no rate, try reverse calculation
      if (!rate) {
        const reverseRate = this.currencyRates[`${toCurrency}_${fromCurrency}`];
        if (reverseRate) {
          rate = 1 / reverseRate;
        }
      }

      if (rate && rate > 0) {
        return Math.round(amount * rate * 100) / 100;
      } else {
        console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
        return amount; // Return original amount if conversion fails
      }
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount; // Return original amount on error
    }
  }

  /**
   * Update currency exchange rates
   */
  private async updateCurrencyRates(): Promise<void> {
    try {
      
      // Using free exchange rate API
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
      
      if (!response.ok) {
        throw new Error(`Currency API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.rates) {
        throw new Error('Invalid currency API response');
      }
      
      // Convert to our format - create all possible currency pairs
      this.currencyRates = {};
      
      // Add USD as base currency
      this.currencyRates['USD_USD'] = 1;
      
      // Add USD to other currencies
      Object.keys(data.rates).forEach(currency => {
        this.currencyRates[`USD_${currency}`] = data.rates[currency];
        this.currencyRates[`${currency}_USD`] = 1 / data.rates[currency];
      });
      
      // Add cross-currency rates (non-USD pairs)
      const currencies = Object.keys(data.rates);
      currencies.forEach(fromCurrency => {
        currencies.forEach(toCurrency => {
          if (fromCurrency !== toCurrency) {
            const fromToUsd = 1 / data.rates[fromCurrency]; // Rate from currency to USD
            const usdToTarget = data.rates[toCurrency]; // Rate from USD to target
            this.currencyRates[`${fromCurrency}_${toCurrency}`] = fromToUsd * usdToTarget;
          } else {
            this.currencyRates[`${fromCurrency}_${toCurrency}`] = 1;
          }
        });
      });

      this.lastCurrencyUpdate = Date.now();
      
    } catch (error) {
      console.error('Failed to update currency rates:', error);
      
      // Set fallback rates if API fails
      if (Object.keys(this.currencyRates).length === 0) {
        this.setFallbackRates();
      }
    }
  }

  /**
   * Set fallback currency rates for common currencies
   */
  private setFallbackRates(): void {
    
    // Basic fallback rates (approximate)
    this.currencyRates = {
      'USD_USD': 1, 'EUR_EUR': 1, 'GBP_GBP': 1, 'INR_INR': 1,
      'USD_EUR': 0.85, 'EUR_USD': 1.18,
      'USD_GBP': 0.73, 'GBP_USD': 1.37,
      'USD_INR': 83.0, 'INR_USD': 0.012,
      'EUR_GBP': 0.86, 'GBP_EUR': 1.16,
      'EUR_INR': 97.5, 'INR_EUR': 0.0103,
      'GBP_INR': 113.8, 'INR_GBP': 0.0088,
      'USD_CAD': 1.25, 'CAD_USD': 0.80,
      'USD_AUD': 1.35, 'AUD_USD': 0.74,
      'USD_JPY': 110.0, 'JPY_USD': 0.0091
    };
    
    this.lastCurrencyUpdate = Date.now();
  }

  /**
   * Validate if question is visa-related and appropriate
   */
  private isVisaRelatedQuestion(question: string, userCountry: string): boolean {
    const visaKeywords = [
      'visa', 'passport', 'travel', 'embassy', 'consulate', 'requirement',
      'document', 'application', 'fee', 'processing', 'approval', 'entry',
      'border', 'immigration', 'permit', 'authorization', 'tourist', 'business',
      'student', 'work', 'transit', 'schengen', 'eta', 'evisa'
    ];

    const questionLower = question.toLowerCase();
    const hasVisaKeyword = visaKeywords.some(keyword => questionLower.includes(keyword));
    const mentionsCountry = questionLower.includes(userCountry.toLowerCase());

    return hasVisaKeyword || mentionsCountry;
  }

  /**
   * Get comprehensive visa requirements with AI-powered insights and real-time data
   */
  async getComprehensiveVisaInfo(context: VisaContext): Promise<VisaRequirement> {
    const cacheKey = `visa-${context.traveler.nationality}-${context.destination}-${context.traveler.travelPurpose}`;
    
    // Check cache first, but allow stale data for faster response
    let cached = visaCache.get<VisaRequirement>(cacheKey);
    if (cached && !visaCache.isStale(cacheKey, 30 * 60 * 1000)) { // 30 minutes
      return cached;
    }

    try {
      const userLocation = await this.getUserLocationInfo();
      const prompt = this.buildAdvancedPrompt(context, userLocation);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sonarApiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: this.getSystemPrompt()
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1,
          top_p: 0.9,
          return_citations: true,
          search_recency_filter: "month"
        }),
      });

      if (!response.ok) {
        throw new Error(`Sonar API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseComprehensiveResponse(data, context);
      
    } catch (error) {
      console.error('Error fetching comprehensive visa info:', error);
      throw error;
    }
  }

  /**
   * Get dynamic document checklist based on traveler profile
   */
  async getDynamicDocumentChecklist(context: VisaContext, visa: VisaRequirement): Promise<string[]> {
    const prompt = `
    Create a personalized document checklist for:
    - ${context.traveler.nationality} citizen traveling to ${context.destination}
    - Purpose: ${context.traveler.travelPurpose}
    - Duration: ${context.stayDuration}
    - Traveler profile: ${context.traveler.employmentStatus}, ${context.traveler.isStudent ? 'Student' : 'Non-student'}
    - Previous visa history: ${context.traveler.visaHistory.join(', ') || 'None'}
    - Visa requirement: ${visa.requirement}

    Generate ONLY the documents this specific traveler needs, not generic lists.
    Consider their nationality, purpose, duration, and profile.
    
    Return as JSON array: ["document 1", "document 2", ...]
    `;

    try {
      const response = await this.callSonarAPI(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return response.split('\n')
        .map(line => line.trim().replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, ''))
        .filter(line => line.length > 5)
        .slice(0, 15);
        
    } catch (error) {
      console.error('Error generating dynamic checklist:', error);
      return this.getFallbackDocuments(context, visa);
    }
  }

  /**
   * Get context-aware processing times based on user location
   */
  async getContextualProcessingTimes(context: VisaContext): Promise<{
    embassy: string;
    location: string;
    standardTime: string;
    currentDelay: string;
    expeditedAvailable: boolean;
    expeditedTime?: string;
    expeditedCost?: string;
    seasonalFactors: string[];
  }> {
    const prompt = `
    Find the specific embassy/consulate for ${context.destination} visa applications from ${context.traveler.currentLocation}.
    
    Provide current processing times (as of January 2025) including:
    - Exact embassy/consulate name and location
    - Standard processing time
    - Current delays or expedited services
    - Seasonal factors affecting processing
    - Expedited options and costs
    
    Format as JSON:
    {
      "embassy": "Embassy name",
      "location": "City, Country",
      "standardTime": "X days/weeks",
      "currentDelay": "Additional X days or No delays",
      "expeditedAvailable": true/false,
      "expeditedTime": "X days",
      "expeditedCost": "$X USD",
      "seasonalFactors": ["factor1", "factor2"]
    }
    `;

    try {
      const response = await this.callSonarAPI(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error getting processing times:', error);
    }

    // Fallback
    return {
      embassy: `${context.destination} Embassy`,
      location: context.traveler.currentLocation,
      standardTime: "2-4 weeks",
      currentDelay: "No current delays",
      expeditedAvailable: false,
      seasonalFactors: ["Peak travel season may cause delays"]
    };
  }

  /**
   * Generate visa alternatives and workarounds
   */
  async getVisaAlternatives(context: VisaContext): Promise<VisaAlternative[]> {
    const prompt = `
    Suggest visa alternatives for ${context.traveler.nationality} citizen wanting to visit ${context.destination}.
    
    Consider:
    1. Visa-free countries near ${context.destination}
    2. Transit routing to avoid difficult visas
    3. Different visa types that might be easier
    4. Regional agreements or special programs
    
    Provide specific, actionable alternatives with clear benefits.
    
    JSON format:
    {
      "alternatives": [
        {
          "type": "visa-free-country|transit-route|different-visa-type",
          "title": "Brief title",
          "description": "Specific explanation",
          "countries": ["country1", "country2"],
          "savings": "Time/cost savings",
          "requirements": ["requirement1", "requirement2"]
        }
      ]
    }
    `;

    try {
      const response = await this.callSonarAPI(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.alternatives || [];
      }
    } catch (error) {
      console.error('Error getting alternatives:', error);
    }

    return [];
  }

  /**
   * Assess visa approval risk based on traveler profile
   */
  async assessVisaRisk(context: VisaContext): Promise<RiskAssessment> {
    const prompt = `
    Assess visa approval chances for:
    - ${context.traveler.nationality} citizen applying for ${context.destination} visa
    - Purpose: ${context.traveler.travelPurpose}
    - Profile: ${context.traveler.employmentStatus}, Financial status: ${context.traveler.financialStatus}
    - Previous visas: ${context.traveler.visaHistory.join(', ') || 'None'}
    - Previous refusals: ${context.traveler.previousRefusals?.join(', ') || 'None'}
    - Schengen history: ${context.traveler.hasSchengenHistory ? 'Yes' : 'No'}
    
    Provide realistic assessment based on immigration patterns and policies.
    
    JSON format:
    {
      "approvalChance": 85,
      "riskFactors": ["factor that could hurt chances"],
      "mitigation": ["how to address risk factors"],
      "strengthFactors": ["factors that help chances"],
      "recommendedApproach": "specific strategy"
    }
    `;

    try {
      const response = await this.callSonarAPI(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error assessing risk:', error);
    }

    // Fallback assessment
    return {
      approvalChance: 75,
      riskFactors: ["Insufficient documentation", "First-time applicant"],
      mitigation: ["Prepare strong financial documents", "Show clear travel intent"],
      strengthFactors: ["Valid passport", "Clear purpose of travel"],
      recommendedApproach: "Prepare thoroughly and apply early"
    };
  }

  /**
   * Get personalized cost breakdown with currency conversion
   */
  async getPersonalizedCostBreakdown(context: VisaContext): Promise<CostBreakdown> {
    try {
      const userLocation = await this.getUserLocationInfo();
      
      const prompt = `
      Calculate EXACT current visa costs for ${context.traveler.nationality} citizen applying for ${context.destination} ${context.traveler.travelPurpose} visa from ${context.traveler.currentLocation}.
      
      IMPORTANT: Use REAL current fees from official embassy/consulate websites and VFS Global centers. 
      
      Examples for reference:
      - Saudi Arabia Tourist E-Visa for Indians: ₹8,000-₹12,000 (single), ₹14,000-₹20,000 (multiple)
      - Saudi Arabia Umrah Visa: ₹5,000-₹10,000 processing fees
      - Saudi Arabia Work Visa: ₹20,000-₹35,000
      - US Tourist Visa: $185 + biometric fees + VFS charges
      - Schengen Visa: €80-90 + service fees €25-35
      - UK Visitor Visa: £100-115 + service fees
      
      Research the specific destination and provide accurate costs including:
      - Official government visa fee (from embassy website)
      - Biometric enrollment fee (VFS/TLS/official centers)
      - Service center processing fee (VFS Global, TLS Contact, etc.)
      - Courier/return document delivery fee
      - Mandatory health insurance cost (if required)
      - Document translation/notarization (if needed)
      - Passport photos (visa specification)
      - Appointment booking fees
      - Any additional mandatory charges
      
      Use the official currency of the destination country for calculations.
      
      STRICT JSON format (no explanation text):
      {
        "visaFee": 185,
        "biometrics": 85,
        "courier": 45,
        "healthInsurance": 0,
        "translation": 75,
        "photos": 25,
        "otherFees": 35,
        "total": 450,
        "currency": "USD",
        "userCurrency": "${userLocation.currency}",
        "hiddenCosts": ["VFS service fee", "SMS notification", "photo service"],
        "breakdown": "Official fee + Service charges + Documentation"
      }
      `;

      const response = await this.callSonarAPI(prompt, true); // real-time for current rates
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const costData = JSON.parse(jsonMatch[0]);
        
        // Convert to user's currency if different
        if (costData.currency !== userLocation.currency) {
          // Convert total amount
          const convertedTotal = await this.convertCurrency(
            costData.total, 
            costData.currency, 
            userLocation.currency
          );
          
          // Convert individual fees for display
          const convertedVisaFee = await this.convertCurrency(costData.visaFee, costData.currency, userLocation.currency);
          const convertedBiometrics = await this.convertCurrency(costData.biometrics, costData.currency, userLocation.currency);
          const convertedCourier = await this.convertCurrency(costData.courier, costData.currency, userLocation.currency);
          const convertedPhotos = await this.convertCurrency(costData.photos, costData.currency, userLocation.currency);
          
          // Add conversion data
          costData.convertedTotal = convertedTotal;
          costData.userCurrency = userLocation.currency;
          costData.exchangeNote = `Converted from ${costData.currency} to ${userLocation.currency}`;
          
          // Store converted individual amounts
          costData.convertedFees = {
            visaFee: convertedVisaFee,
            biometrics: convertedBiometrics,
            courier: convertedCourier,
            photos: convertedPhotos,
            healthInsurance: costData.healthInsurance ? await this.convertCurrency(costData.healthInsurance, costData.currency, userLocation.currency) : 0,
            translation: costData.translation ? await this.convertCurrency(costData.translation, costData.currency, userLocation.currency) : 0,
            otherFees: await this.convertCurrency(costData.otherFees, costData.currency, userLocation.currency)
          };
        }
        
        return costData;
      } else {
        console.error('No JSON found in cost breakdown response');
      }
    } catch (error) {
      console.error('Error getting cost breakdown:', error);
    }

    // Fallback costs - realistic estimates based on common visa fees
    const fallbackCurrency = this.getDestinationCurrency(context.destination);
    const fallbackCosts = this.getFallbackCosts(context.destination, context.traveler.travelPurpose, fallbackCurrency);
    
    return fallbackCosts;
  }

  /**
   * Generate smart alerts for the traveler
   */
  async generateSmartAlerts(context: VisaContext, visa: VisaRequirement): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = [];
    const now = new Date();
    const travelDate = new Date(context.travelDate);
    const daysUntilTravel = Math.ceil((travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Processing time alerts
    if (visa.processingTime) {
      const processingDays = this.extractDaysFromString(visa.processingTime);
      if (daysUntilTravel <= processingDays + 7) {
        alerts.push({
          id: 'urgent-application',
          type: 'deadline',
          title: 'Urgent Application Required',
          message: `Apply immediately! Processing takes ${visa.processingTime}.`,
          urgency: 'high',
          actionRequired: true,
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notificationDate: now.toISOString().split('T')[0]
        });
      }
    }

    // Passport expiry alerts
    if (context.traveler.passportExpiry) {
      const passportExpiry = new Date(context.traveler.passportExpiry);
      const monthsUntilExpiry = (passportExpiry.getTime() - travelDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsUntilExpiry < 6) {
        alerts.push({
          id: 'passport-renewal',
          type: 'document-expiry',
          title: 'Passport Renewal Required',
          message: `Your passport expires in ${Math.floor(monthsUntilExpiry)} months. Many countries require 6+ months validity.`,
          urgency: 'high',
          actionRequired: true,
          dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notificationDate: now.toISOString().split('T')[0]
        });
      }
    }

    // Policy change alerts (simulated - in real app, this would connect to policy monitoring)
    alerts.push({
      id: 'policy-update',
      type: 'policy-change',
      title: 'Recent Policy Update',
      message: `${context.destination} updated visa requirements for ${context.traveler.nationality} citizens.`,
      urgency: 'medium',
      actionRequired: false,
      notificationDate: now.toISOString().split('T')[0]
    });

    return alerts;
  }

  /**
   * Enhanced Chat with Visa AI - validates questions and provides geo-specific answers
   */
  async chatWithVisaAI(question: string, context: VisaContext): Promise<string> {
    try {
      const userLocation = await this.getUserLocationInfo();
      
      // Validate if question is visa-related
      if (!this.isVisaRelatedQuestion(question, userLocation.country)) {
        return `I can only help with visa and travel-related questions for ${userLocation.country} citizens. Please ask about visa requirements, documents, processing times, or travel procedures.`;
      }

      // Check cache for similar questions
      const cacheKey = `chat-${context.traveler.nationality}-${context.destination}-${question.toLowerCase().slice(0, 50)}`;
      const cached = visaCache.get<string>(cacheKey);
      
      if (cached && !visaCache.isStale(cacheKey, 30 * 60 * 1000)) { // 30 minutes for chat
        return cached;
      }

      const prompt = `
      Answer this visa question for a ${context.traveler.nationality} citizen (currently in ${userLocation.country}) traveling to ${context.destination}:
      
      Question: "${question}"
      
      User Context:
      - Detected location: ${userLocation.country}
      - Home currency: ${userLocation.currency}
      - Purpose: ${context.traveler.travelPurpose}
      - Duration: ${context.stayDuration}
      - Travel date: ${context.travelDate}
      - Current location: ${context.traveler.currentLocation}
      - Previous visas: ${context.traveler.visaHistory.join(', ') || 'None'}
      
      Requirements:
      1. Provide a clear, conversational answer (NOT JSON format)
      2. Convert any costs to ${userLocation.currency}
      3. Include recent policy updates (2024-2025)
      4. Mention official sources and useful links
      5. Be concise but comprehensive
      6. Focus on ${userLocation.country} citizen perspective
      7. Format as readable paragraphs with bullet points where helpful
      8. Use emojis sparingly for better readability
      
      IMPORTANT: Respond in plain text format, not JSON. Make it conversational and easy to read.
      Use search_recency_filter: last_year for the most current information.
      `;

      const response = await this.callSonarAPI(prompt, true); // true for real-time data
      
      // Parse and format the response if it's JSON
      const formattedResponse = this.formatChatResponse(response);
      
      // Cache the formatted response
      visaCache.set(cacheKey, formattedResponse, 30 * 60 * 1000); // 30 minutes
      
      return formattedResponse;
      
    } catch (error) {
      console.error('Error in enhanced AI chat:', error);
      return "I'm unable to answer that question right now. Please check official embassy websites for the most current information.";
    }
  }

  // Private helper methods

  private buildAdvancedPrompt(context: VisaContext, userLocation?: { country: string; currency: string; countryCode: string }): string {
    return `
    Comprehensive visa analysis for ${context.traveler.nationality} citizen traveling to ${context.destination}.
    
    TRAVELER PROFILE:
    - Nationality: ${context.traveler.nationality}
    - Current location: ${context.traveler.currentLocation}
    - Purpose: ${context.traveler.travelPurpose}
    - Duration: ${context.stayDuration}
    - Travel date: ${context.travelDate}
    - Employment: ${context.traveler.employmentStatus}
    - Student status: ${context.traveler.isStudent ? 'Yes' : 'No'}
    - Previous visas: ${context.traveler.visaHistory.join(', ') || 'None'}
    - Schengen history: ${context.traveler.hasSchengenHistory ? 'Yes' : 'No'}
    - Previous refusals: ${context.traveler.previousRefusals?.join(', ') || 'None'}
    - User detected location: ${userLocation?.country || 'Unknown'}
    - User currency: ${userLocation?.currency || 'USD'}
    - Trip type: ${context.tripType}
    
    ANALYSIS REQUIRED:
    1. Visa requirement (visa-free/required/on-arrival/eta)
    2. Specific documents for THIS traveler profile
    3. Processing time from ${context.traveler.currentLocation}
    4. Complete cost breakdown including hidden fees
    5. Embassy/consulate information for applications
    6. Risk assessment based on profile
    7. Alternative options and workarounds
    8. Recent policy changes affecting this nationality
    9. Success rate and difficulty assessment
    10. Personalized tips and warnings
    
    Provide response in this JSON format:
    {
      "country": "${context.destination}",
      "requirement": "visa-free|visa-required|visa-on-arrival|eta-required",
      "maxStay": "X days/months",
      "processingTime": "X days/weeks",
      "cost": "$X USD",
      "documents": ["document1", "document2"],
      "officialLinks": ["url1", "url2"],
      "embassyInfo": {
        "name": "Embassy name",
        "location": "City",
        "address": "Full address",
        "phone": "Phone number",
        "email": "Email",
        "website": "Website URL",
        "appointments": {
          "waitTime": "X days",
          "bookingUrl": "URL",
          "requirements": ["requirement1"]
        }
      },
      "riskAssessment": {
        "approvalChance": 85,
        "riskFactors": ["factor1"],
        "mitigation": ["solution1"],
        "strengthFactors": ["strength1"],
        "recommendedApproach": "strategy"
      },
      "alternatives": [
        {
          "type": "visa-free-country",
          "title": "Alternative option",
          "description": "Description",
          "countries": ["country1"],
          "savings": "Benefit"
        }
      ],
      "costBreakdown": {
        "visaFee": 160,
        "biometrics": 85,
        "courier": 40,
        "total": 285,
        "currency": "USD",
        "hiddenCosts": ["fee1"]
      },
      "aiInsights": {
        "difficulty": "easy|moderate|complex",
        "successRate": 85,
        "tips": ["tip1"],
        "warnings": ["warning1"],
        "personalizedAdvice": ["advice1"]
      },
      "recentChanges": "Policy changes if any"
    }
    `;
  }

  private getSystemPrompt(): string {
    return `You are an expert visa and immigration specialist with comprehensive knowledge of:
    
    1. Current visa policies for all countries (2025)
    2. Bilateral agreements and exceptions
    3. Embassy procedures and processing times
    4. Document requirements by nationality and purpose
    5. Immigration risk factors and approval patterns
    6. EXACT cost structures and hidden fees from official sources
    7. Alternative travel routes and visa options
    8. Recent policy changes and travel restrictions
    
    CRITICAL GUIDELINES:
    - Always consider the traveler's specific nationality and profile
    - Factor in purpose of travel and duration
    - Provide current, accurate information (September 2025)
    - Include embassy-specific information for application location
    - Consider risk factors that affect approval chances
    - Suggest practical alternatives when beneficial
    - IMPORTANT: For costs, use REAL current fees from official embassy websites, VFS Global, TLS Contact, and authorized visa centers
    - Include ALL applicable fees: visa fee, biometric fee, service fees, courier charges, health insurance, etc.
    - Be specific, not generic
    
    COST ACCURACY REQUIREMENTS:
    - Research official embassy and consulate fee schedules
    - Include VFS Global, TLS Contact, and other authorized service center fees
    - Factor in nationality-specific fee structures
    - Consider visa type variations (tourist, business, work, student, etc.)
    - Include mandatory insurance costs where required
    - Account for document processing and courier fees
    - Use destination country's official currency for calculations
    
    RESPONSE FORMAT:
    - For structured data requests: Respond in JSON format as requested
    - For chat/question responses: Provide clear, conversational text with proper formatting
    - For chat responses: Use markdown formatting (**, bullet points) for readability
    - Never mix JSON and conversational formats in the same response`;
  }

  private async callSonarAPI(prompt: string, realTime: boolean = false): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sonarApiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        top_p: 0.9,
        return_citations: true,
        search_recency_filter: realTime ? "day" : "month"
      }),
    });

    if (!response.ok) {
      throw new Error(`Sonar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseComprehensiveResponse(data: any, context: VisaContext): VisaRequirement {
    try {
      const content = data.choices[0].message.content;
      
      // Try to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure all required fields are present
        return {
          country: parsed.country || context.destination,
          countryCode: parsed.countryCode || this.getCountryCode(context.destination),
          flag: parsed.flag || this.getCountryFlag(context.destination),
          requirement: parsed.requirement || 'visa-required',
          maxStay: parsed.maxStay || 'Check embassy requirements',
          processingTime: parsed.processingTime,
          cost: parsed.cost,
          documents: parsed.documents || ['Valid passport', 'Application form'],
          officialLinks: parsed.officialLinks || [],
          embassyInfo: parsed.embassyInfo,
          riskAssessment: parsed.riskAssessment,
          alternatives: parsed.alternatives || [],
          costBreakdown: parsed.costBreakdown,
          smartAlerts: [],
          aiInsights: parsed.aiInsights || {
            difficulty: 'moderate',
            successRate: 75,
            tips: ['Prepare documentation thoroughly'],
            warnings: [],
            personalizedAdvice: []
          },
          recentChanges: parsed.recentChanges
        };
      }
    } catch (error) {
      console.error('Error parsing comprehensive response:', error);
    }

    // Fallback response
    return this.getFallbackVisaInfo(context);
  }

  private getFallbackVisaInfo(context: VisaContext): VisaRequirement {
    return {
      country: context.destination,
      countryCode: this.getCountryCode(context.destination),
      flag: this.getCountryFlag(context.destination),
      requirement: 'visa-required',
      maxStay: 'Check embassy requirements',
      documents: ['Valid passport', 'Application form', 'Photos', 'Financial proof'],
      officialLinks: [],
      aiInsights: {
        difficulty: 'moderate',
        successRate: 75,
        tips: ['Contact embassy for current requirements'],
        warnings: ['Check processing times before travel']
      }
    };
  }

  /**
   * Format chat response from JSON to readable text
   */
  private formatChatResponse(response: string): string {
    try {
      // Check if response is JSON
      if (response.trim().startsWith('{') || response.includes('"travel_procedures"')) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          return this.convertJsonToReadableText(data);
        }
      }
      
      // If not JSON, return as is
      return response;
      
    } catch (error) {
      console.warn('Could not parse chat response as JSON, returning raw text');
      return response;
    }
  }

  /**
   * Convert JSON visa data to readable text format
   */
  private convertJsonToReadableText(data: any): string {
    let text = '';

    if (data.travel_procedures) {
      const proc = data.travel_procedures;
      
      if (proc.visa_type) {
        text += `📋 **Visa Type:** ${proc.visa_type}\n\n`;
      }

      if (proc.application_process && Array.isArray(proc.application_process)) {
        text += `🔄 **Application Process:**\n`;
        proc.application_process.forEach((step: string, index: number) => {
          text += `${index + 1}. ${step.replace(/^Step \d+:\s*/, '')}\n`;
        });
        text += '\n';
      }

      if (proc.document_checklist && Array.isArray(proc.document_checklist)) {
        text += `📄 **Required Documents:**\n`;
        proc.document_checklist.forEach((doc: string) => {
          text += `• ${doc}\n`;
        });
        text += '\n';
      }

      if (proc.fees) {
        text += `💰 **Fees & Costs:**\n`;
        Object.entries(proc.fees).forEach(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          text += `• ${formattedKey}: ${value}\n`;
        });
        text += '\n';
      }

      if (proc.recent_policy_updates && Array.isArray(proc.recent_policy_updates)) {
        text += `⚠️ **Recent Policy Updates:**\n`;
        proc.recent_policy_updates.forEach((update: string) => {
          text += `• ${update}\n`;
        });
        text += '\n';
      }

      if (proc.official_sources && Array.isArray(proc.official_sources)) {
        text += `🔗 **Official Sources:**\n`;
        proc.official_sources.forEach((source: string) => {
          text += `• ${source}\n`;
        });
        text += '\n';
      }

      if (proc.additional_tips && Array.isArray(proc.additional_tips)) {
        text += `💡 **Additional Tips:**\n`;
        proc.additional_tips.forEach((tip: string) => {
          text += `• ${tip}\n`;
        });
      }
    }

    // Fallback for other JSON structures
    if (!text && typeof data === 'object') {
      text = this.parseGenericJson(data);
    }

    return text || 'I received information but had trouble formatting it. Please try asking your question again.';
  }

  /**
   * Parse generic JSON structure into readable text
   */
  private parseGenericJson(obj: any, level: number = 0): string {
    let text = '';
    const indent = '  '.repeat(level);

    for (const [key, value] of Object.entries(obj)) {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (Array.isArray(value)) {
        text += `${indent}**${formattedKey}:**\n`;
        value.forEach((item: any) => {
          if (typeof item === 'string') {
            text += `${indent}• ${item}\n`;
          } else {
            text += `${indent}• ${JSON.stringify(item)}\n`;
          }
        });
        text += '\n';
      } else if (typeof value === 'object' && value !== null) {
        text += `${indent}**${formattedKey}:**\n`;
        text += this.parseGenericJson(value, level + 1);
      } else {
        text += `${indent}**${formattedKey}:** ${value}\n`;
      }
    }

    return text;
  }

  private getFallbackDocuments(context: VisaContext, _visa: VisaRequirement): string[] {
    const docs = ['Valid passport', 'Visa application form', 'Passport photos'];
    
    if (context.traveler.travelPurpose === 'business') {
      docs.push('Business invitation letter', 'Company registration');
    } else if (context.traveler.travelPurpose === 'study') {
      docs.push('School acceptance letter', 'Financial proof for studies');
    }
    
    docs.push('Travel insurance', 'Financial statements', 'Flight itinerary');
    return docs;
  }

  private getCountryCode(countryName: string): string {
    const codeMap: { [key: string]: string } = {
      'united states': 'US', 'usa': 'US',
      'united kingdom': 'GB', 'uk': 'GB',
      'japan': 'JP', 'germany': 'DE', 'australia': 'AU',
      'canada': 'CA', 'france': 'FR', 'singapore': 'SG'
    };
    return codeMap[countryName.toLowerCase()] || 'XX';
  }

  private getCountryFlag(countryName: string): string {
    const flagMap: { [key: string]: string } = {
      'united states': '🇺🇸', 'usa': '🇺🇸',
      'united kingdom': '🇬🇧', 'uk': '🇬🇧',
      'japan': '🇯🇵', 'germany': '🇩🇪', 'australia': '🇦🇺',
      'canada': '🇨🇦', 'france': '🇫🇷', 'singapore': '🇸🇬'
    };
    return flagMap[countryName.toLowerCase()] || '🏳️';
  }

  private extractDaysFromString(timeString: string): number {
    const match = timeString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 14;
  }

  /**
   * Get destination country currency
   */
  private getDestinationCurrency(destination: string): string {
    const currencyMap: { [key: string]: string } = {
      'united states': 'USD', 'usa': 'USD',
      'united kingdom': 'GBP', 'uk': 'GBP',
      'saudi arabia': 'SAR', 'ksa': 'SAR',
      'united arab emirates': 'AED', 'uae': 'AED',
      'germany': 'EUR', 'france': 'EUR', 'italy': 'EUR', 'spain': 'EUR',
      'netherlands': 'EUR', 'belgium': 'EUR', 'austria': 'EUR', 'portugal': 'EUR',
      'japan': 'JPY', 'australia': 'AUD', 'canada': 'CAD',
      'singapore': 'SGD', 'switzerland': 'CHF',
      'india': 'INR', 'china': 'CNY', 'thailand': 'THB',
      'malaysia': 'MYR', 'south korea': 'KRW',
      'turkey': 'TRY', 'russia': 'RUB', 'brazil': 'BRL'
    };
    return currencyMap[destination.toLowerCase()] || 'USD';
  }

  /**
   * Get realistic fallback costs based on destination and visa type
   */
  private getFallbackCosts(destination: string, purpose: string, currency: string): CostBreakdown {
    const dest = destination.toLowerCase();
    const costData: { [key: string]: any } = {};

    // Saudi Arabia costs (example from user)
    if (dest.includes('saudi') || dest.includes('ksa')) {
      if (purpose === 'tourism') {
        costData.visaFee = 440; // ~$117 USD
        costData.biometrics = 190; // ~$50 USD  
        costData.courier = 75;
        costData.photos = 40;
        costData.otherFees = 120;
        costData.total = 865; // ~$230 USD equivalent of ₹8,000-12,000
        costData.currency = 'SAR';
      } else if (purpose === 'work') {
        costData.visaFee = 1125; // Higher for work visa
        costData.biometrics = 190;
        costData.courier = 75;
        costData.healthInsurance = 300;
        costData.translation = 150;
        costData.photos = 40;
        costData.otherFees = 200;
        costData.total = 2080; // ~$555 USD equivalent of ₹20,000-35,000
        costData.currency = 'SAR';
      } else if (purpose === 'umrah' || purpose === 'pilgrimage') {
        costData.visaFee = 0; // Free visa
        costData.biometrics = 190;
        costData.courier = 75;
        costData.photos = 40;
        costData.otherFees = 260; // Service fees
        costData.total = 565; // ~$150 USD equivalent of ₹5,000-10,000
        costData.currency = 'SAR';
      }
    }
    // USA costs
    else if (dest.includes('united states') || dest.includes('usa')) {
      costData.visaFee = 185;
      costData.biometrics = 85;
      costData.courier = 45;
      costData.photos = 25;
      costData.otherFees = 60; // VFS service fees
      costData.total = 400;
      costData.currency = 'USD';
    }
    // Schengen countries
    else if (['germany', 'france', 'italy', 'spain', 'netherlands', 'belgium', 'austria', 'portugal'].some(country => dest.includes(country))) {
      costData.visaFee = 80;
      costData.biometrics = 0; // Included
      costData.courier = 25;
      costData.photos = 15;
      costData.otherFees = 30; // VFS service fee
      costData.total = 150;
      costData.currency = 'EUR';
    }
    // UK costs
    else if (dest.includes('united kingdom') || dest.includes('uk')) {
      costData.visaFee = 115;
      costData.biometrics = 0; // Included
      costData.courier = 35;
      costData.photos = 20;
      costData.otherFees = 40; // TLS Contact fees
      costData.total = 210;
      costData.currency = 'GBP';
    }
    // Default costs for other countries
    else {
      costData.visaFee = 100;
      costData.biometrics = 50;
      costData.courier = 30;
      costData.photos = 20;
      costData.otherFees = 40;
      costData.total = 240;
      costData.currency = currency;
    }

    return {
      visaFee: costData.visaFee,
      biometrics: costData.biometrics,
      courier: costData.courier,
      healthInsurance: costData.healthInsurance || 0,
      translation: costData.translation || 0,
      photos: costData.photos,
      otherFees: costData.otherFees,
      total: costData.total,
      currency: costData.currency,
      hiddenCosts: ['Service center fees', 'Processing charges', 'Document handling']
    };
  }
}

export const visaAIService = new VisaAIService();
