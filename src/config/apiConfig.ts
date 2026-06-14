/**
 * API Configuration for Flight Tracking Services and AI-Powered Features
 */

export const API_CONFIG = {
  // FlightRadar24 API Configuration
  FR24: {
    BASE_URL: 'https://fr24api.flightradar24.com',
    API_KEY: import.meta.env.VITE_FR24_API_KEY || '',
    ENDPOINTS: {
      LIVE_FLIGHT_POSITIONS: '/api/live/flight-positions/full',
      FLIGHT_SUMMARY: '/api/flight-summary/full',
      HISTORIC_POSITIONS: '/api/historic/flight-positions/full',
      FLIGHT_EVENTS: '/api/historic/flight-events/full',
      FLIGHT_TRACK: '/api/historic/flight-track/full'
    }
  },

  // Aviationstack API Configuration
  AVIATIONSTACK: {
    BASE_URL: 'https://api.aviationstack.com/v1',
    API_KEY: import.meta.env.VITE_AVIATIONSTACK_API_KEY || '',
    ENDPOINTS: {
      FLIGHTS: '/flights',
      ROUTES: '/routes',
      AIRPORTS: '/airports',
      AIRLINES: '/airlines',
      AIRPLANES: '/airplanes',
      AIRCRAFT_TYPES: '/aircraft_types',
      TAXES: '/taxes',
      CITIES: '/cities',
      COUNTRIES: '/countries',
      TIMETABLE: '/timetable',
      FLIGHTS_FUTURE: '/flightsFuture'
    }
  },

  // Aviation Edge API Configuration
  AVIATION_EDGE: {
    BASE_URL: 'https://aviation-edge.com/v2/public',
    API_KEY: import.meta.env.VITE_AVIATION_EDGE_API_KEY || '',
    ENDPOINTS: {
      TIMETABLE: '/timetable',
      AIRPORT_DATABASE: '/airportDatabase',
      AIRLINE_DATABASE: '/airlineDatabase',
      AIRCRAFT_DATABASE: '/airplaneDatabase'
    }
  },

  // Appwrite Configuration
  APPWRITE: {
    PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
    ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io',
    FUNCTION_ID: import.meta.env.VITE_APPWRITE_FUNCTION_ID || 'aviation-enrichment-proxy',
    // Helper method to get the correct base URL
    getBaseUrl() {
      const endpoint = this.ENDPOINT;
      // If endpoint already ends with /v1, use it as is, otherwise add /v1
      return endpoint.endsWith('/v1') ? endpoint : `${endpoint}/v1`;
    }
  },

  // AI Services Configuration
  AI_SERVICES: {
    // Gemini API for AI insights and trip planning
    GEMINI: {
      API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
      BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
    },
    
    // Perplexity Sonar for real-time visa intelligence
    SONAR: {
      API_KEY: import.meta.env.VITE_SONAR_API_KEY || '',
      BASE_URL: 'https://api.perplexity.ai/chat/completions',
      MODEL: 'sonar'
    }
  }
};


/**
 * Check if required API keys are configured
 */
export function validateAPIKeys(): { 
  fr24: boolean; 
  aviationEdge: boolean; 
  appwrite: boolean; 
  gemini: boolean; 
  sonar: boolean; 
} {
  return {
    fr24: !!API_CONFIG.FR24.API_KEY,
    aviationEdge: !!API_CONFIG.AVIATION_EDGE.API_KEY,
    appwrite: !!API_CONFIG.APPWRITE.PROJECT_ID,
    gemini: !!API_CONFIG.AI_SERVICES.GEMINI.API_KEY,
    sonar: !!API_CONFIG.AI_SERVICES.SONAR.API_KEY
  };
}

/**
 * Get API key validation status for UI display
 */
export function getAPIKeyStatus(): {
  fr24: { configured: boolean; message: string };
  aviationEdge: { configured: boolean; message: string };
  appwrite: { configured: boolean; message: string };
  gemini: { configured: boolean; message: string };
  sonar: { configured: boolean; message: string };
} {
  const fr24Configured = !!API_CONFIG.FR24.API_KEY;
  const aviationEdgeConfigured = !!API_CONFIG.AVIATION_EDGE.API_KEY;
  const appwriteConfigured = !!API_CONFIG.APPWRITE.PROJECT_ID;
  const geminiConfigured = !!API_CONFIG.AI_SERVICES.GEMINI.API_KEY;
  const sonarConfigured = !!API_CONFIG.AI_SERVICES.SONAR.API_KEY;

  return {
    fr24: {
      configured: fr24Configured,
      message: fr24Configured 
        ? '✅ FR24 API key configured' 
        : '⚠️ FR24 API key not configured - live tracking will be limited'
    },
    aviationEdge: {
      configured: aviationEdgeConfigured,
      message: aviationEdgeConfigured 
        ? '✅ Aviation Edge API key configured' 
        : '⚠️ Aviation Edge API key not configured - data enrichment will be limited'
    },
    appwrite: {
      configured: appwriteConfigured,
      message: appwriteConfigured 
        ? '✅ Appwrite configured - enrichment proxy available' 
        : '⚠️ Appwrite not configured - enrichment calls will fail'
    },
    gemini: {
      configured: geminiConfigured,
      message: geminiConfigured 
        ? '✅ Gemini API configured - AI insights available' 
        : '⚠️ Gemini API not configured - AI features will be limited'
    },
    sonar: {
      configured: sonarConfigured,
      message: sonarConfigured 
        ? '✅ Sonar API configured - advanced visa intelligence available' 
        : '⚠️ Sonar API not configured - visa checker will use basic functionality'
    }
  };
}
