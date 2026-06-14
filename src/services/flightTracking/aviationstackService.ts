/**
 * Aviationstack API Service
 * Professional service for interacting with Aviationstack API endpoints
 */

import { API_CONFIG } from '@/config/apiConfig';
import airportService from '../airportService';

// Aviationstack API Response Types
export interface AviationstackSchedule {
  type: 'arrival' | 'departure';
  status: string;
  departure: {
    iataCode?: string;
    icaoCode?: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduledTime?: string;
    estimatedTime?: string;
    actualTime?: string;
    estimatedRunway?: string;
    actualRunway?: string;
  };
  arrival: {
    iataCode?: string;
    icaoCode?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    delay?: number;
    scheduledTime?: string;
    estimatedTime?: string;
    actualTime?: string;
    estimatedRunway?: string;
    actualRunway?: string;
  };
  airline: {
    name?: string;
    iataCode?: string;
    icaoCode?: string;
  };
  flight: {
    number?: string;
    iataNumber?: string;
    icaoNumber?: string;
  };
  codeshared?: {
    airline: {
      name?: string;
      iataCode?: string;
      icaoCode?: string;
    };
    flight: {
      number?: string;
      iataNumber?: string;
      icaoNumber?: string;
    };
  };
  aircraft?: {
    registration?: string;
    regNumber?: string;
    type?: string;
    modelCode?: string;
    model?: string;
    modelText?: string;
    year?: number;
    hex?: string;
  };
}

export interface AviationstackAirport {
  airport_name?: string;
  iata_code?: string;
  icao_code?: string;
  latitude?: string;
  longitude?: string;
  geoname_id?: string;
  timezone?: string;
  gmt?: string;
  phone_number?: string;
  country_name?: string;
  country_iso2?: string;
  city_iata_code?: string;
}

export interface AviationstackAirline {
  airline_id?: string;
  airline_name?: string;
  iata_code?: string;
  icao_code?: string;
  callsign?: string;
  type?: string;
  status?: string;
  fleet_size?: string;
  fleet_average_age?: string;
  date_founded?: string;
  hub_code?: string;
  country_name?: string;
  country_iso2?: string;
}

export interface AviationstackAircraft {
  id?: string;
  registration_number?: string;
  production_line?: string;
  iata_type?: string;
  model_name?: string;
  model_code?: string;
  icao_code_hex?: string;
  iata_code_short?: string;
  iata_code_long?: string;
  construction_number?: string;
  test_registration_number?: string;
  rollout_date?: string;
  first_flight_date?: string;
  delivery_date?: string;
  registration_date?: string;
  line_number?: string;
  plane_series?: string;
  airline_iata_code?: string;
  airline_icao_code?: string;
  plane_owner?: string;
  engines_count?: string;
  engines_type?: string;
  plane_age?: string;
  plane_status?: string;
  plane_class?: string;
}

export interface AviationstackRoute {
  departure: {
    airport?: string;
    timezone?: string;
    iata?: string;
    icao?: string;
    terminal?: string;
    time?: string;
  };
  arrival: {
    airport?: string;
    timezone?: string;
    iata?: string;
    icao?: string;
    terminal?: string;
    time?: string;
  };
  airline: {
    name?: string;
    callsign?: string;
    iata?: string;
    icao?: string;
  };
  flight: {
    number?: string;
  };
}

export interface AviationstackFlight {
  flight_date?: string;
  flight_status?: string;
  departure: {
    airport?: string;
    timezone?: string;
    iata?: string;
    icao?: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduled?: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  arrival: {
    airport?: string;
    timezone?: string;
    iata?: string;
    icao?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    delay?: number;
    scheduled?: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  airline: {
    name?: string;
    iata?: string;
    icao?: string;
  };
  flight: {
    number?: string;
    iata?: string;
    icao?: string;
    codeshared?: any;
  };
  aircraft?: {
    registration?: string;
    iata?: string;
    icao?: string;
    icao24?: string;
  };
  live?: {
    updated?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    direction?: number;
    speed_horizontal?: number;
    speed_vertical?: number;
    is_ground?: boolean;
  };
}

class AviationstackService {
  private apiKey: string;
  private baseUrl: string;
  private lastRequestTime: number = 0;

  constructor() {
    this.apiKey = API_CONFIG.AVIATIONSTACK.API_KEY;
    this.baseUrl = API_CONFIG.AVIATIONSTACK.BASE_URL;
  }

  /**
   * Rate limiting: Ensure minimum 10 seconds between requests (for free plan)
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 10000; // 10 seconds for free plan

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('429')) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // For other errors, don't retry
          throw lastError;
        }
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Helper function to parse flight number into airline code and flight number
   */
  private parseFlightNumber(flightNumber: string): { airlineCode: string | null; flightNum: string } {
    // Try 2-character codes first (most common)
    // Pattern: 2 letters (AA, SV, 6E, etc.)
    let airlineMatch = flightNumber.match(/^([A-Z]{2}|[0-9][A-Z]|[A-Z][0-9])/i);
    
    // If no 2-char match, try 3-character codes
    if (!airlineMatch) {
      airlineMatch = flightNumber.match(/^([A-Z]{3})/i);
    }
    
    const airlineCode = airlineMatch?.[1]?.toUpperCase() || null;
    const flightNum = airlineCode ? flightNumber.slice(airlineCode.length) : flightNumber;
    
    
    return { airlineCode, flightNum };
  }

  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<any> {
    return this.retryWithBackoff(async () => {
      try {
        // Apply rate limiting
        await this.rateLimit();
        
        // Direct API call to AviationStack
        const queryParams = new URLSearchParams({ access_key: this.apiKey, ...params });
        const url = `${this.baseUrl}${endpoint}?${queryParams}`;
        
        console.log('📡 Direct AviationStack API call:', url.replace(this.apiKey, '***'));
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`AviationStack API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Check for API error responses
        if (data.error) {
          console.error('❌ AviationStack API error:', data.error);
          return data; // Return the error data so we can handle it
        }
        
        console.log('✅ Direct AviationStack API request successful');
        return data;
      } catch (error) {
        console.error('❌ Aviationstack Service Error:', error);
        throw error; // Re-throw to trigger retry mechanism
      }
    });
  }

  /**
   * Get real-time flights
   */
  async getFlights(params: {
    limit?: string;
    offset?: string;
    flight_status?: string;
    flight_date?: string;
    dep_iata?: string;
    arr_iata?: string;
    dep_icao?: string;
    arr_icao?: string;
    airline_name?: string;
    airline_iata?: string;
    airline_icao?: string;
    flight_number?: string;
    flight_iata?: string;
    flight_icao?: string;
    min_delay_dep?: string;
    min_delay_arr?: string;
    max_delay_dep?: string;
    max_delay_arr?: string;
    arr_scheduled_time_arr?: string;
    dep_scheduled_time_dep?: string;
  }): Promise<AviationstackFlight[]> {

    // Clean up parameters (remove undefined values)
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.FLIGHTS, cleanParams);
    
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    return [];
  }

  /**
   * Get historical flights
   */
  async getHistoricalFlights(params: {
    flight_date: string;
    limit?: string;
    offset?: string;
    flight_status?: string;
    dep_iata?: string;
    arr_iata?: string;
    dep_icao?: string;
    arr_icao?: string;
    airline_name?: string;
    airline_iata?: string;
    airline_icao?: string;
    flight_number?: string;
    flight_iata?: string;
    flight_icao?: string;
    min_delay_dep?: string;
    min_delay_arr?: string;
    max_delay_dep?: string;
    max_delay_arr?: string;
    arr_scheduled_time_arr?: string;
    dep_scheduled_time_dep?: string;
  }): Promise<AviationstackFlight[]> {
    console.log(`📅 Aviationstack Historical Flights API call with params:`, params);

    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.FLIGHTS, cleanParams);
    
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`✅ Aviationstack Historical Flights API returned ${data.data.length} flights`);
      return data.data;
    }
    
    console.warn(`⚠️ Aviationstack Historical Flights API returned non-array data:`, data);
    return [];
  }

  /**
   * Get flight schedules (timetable)
   */
  async getTimetable(params: {
    iataCode: string;
    type: 'departure' | 'arrival';
    status?: string;
    dep_terminal?: string;
    dep_delay?: string;
    dep_schTime?: string;
    dep_estTime?: string;
    dep_actTime?: string;
    dep_estRunway?: string;
    dep_actRunway?: string;
    arr_terminal?: string;
    arr_delay?: string;
    arr_schTime?: string;
    arr_estTime?: string;
    arr_actTime?: string;
    arr_estRunway?: string;
    arr_actRunway?: string;
    airline_name?: string;
    airline_iata?: string;
    airline_icao?: string;
    flight_num?: string;
    flight_iata?: string;
    flight_icao?: string;
    lang?: string;
  }): Promise<AviationstackSchedule[]> {
    console.log(`📡 Aviationstack Timetable API call with params:`, {
      iataCode: params.iataCode,
      type: params.type,
      filters: Object.keys(params).filter(key => key !== 'iataCode' && key !== 'type' && params[key as keyof typeof params]).length
    });

    // Clean up parameters (remove undefined values)
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.TIMETABLE, cleanParams);
    
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`✅ Aviationstack Timetable API returned ${data.data.length} schedules`);
      
      // Log sample response structure for verification
      if (data.data.length > 0) {
        const sample = data.data[0];
        console.log(`📋 Sample schedule structure:`, {
          hasAirline: !!sample.airline,
          hasFlightInfo: !!sample.flight,
          hasDeparture: !!sample.departure,
          hasArrival: !!sample.arrival,
          hasCodeshare: !!sample.codeshared,
          status: sample.status,
          type: sample.type
        });
      }
      
      return data.data;
    }
    
    console.warn(`⚠️ Aviationstack Timetable API returned non-array data:`, data);
    return [];
  }

  /**
   * Get future flight schedules
   */
  async getFutureFlights(params: {
    iataCode: string;
    type: 'departure' | 'arrival';
    date: string;
    airline_iata?: string;
    airline_icao?: string;
    flight_number?: string;
  }): Promise<AviationstackSchedule[]> {
    console.log(`📅 Aviationstack Future Flights API call with params:`, params);

    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.FLIGHTS_FUTURE, cleanParams);
    
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`✅ Aviationstack Future Flights API returned ${data.data.length} flights`);
      return data.data;
    }
    
    console.warn(`⚠️ Aviationstack Future Flights API returned non-array data:`, data);
    return [];
  }

  /**
   * Get airport information using enhanced airport service
   */
  async getAirportInfo(iataCode: string): Promise<AviationstackAirport | null> {
    try {
      // Use enhanced airport service for better data
      const airportInfo = await airportService.getAirportInfo(iataCode);
      
      if (airportInfo) {
        // Convert to AviationstackAirport format for compatibility
        return {
          airport_name: airportInfo.name,
          iata_code: airportInfo.iataCode,
          icao_code: airportInfo.icaoCode,
          latitude: airportInfo.latitude,
          longitude: airportInfo.longitude,
          geoname_id: '',
          timezone: airportInfo.timezone,
          gmt: airportInfo.gmt,
          phone_number: undefined,
          country_name: airportInfo.country,
          country_iso2: '',
          city_iata_code: airportInfo.city
        };
      }
      
      // Fallback to direct API call if enhanced service fails
      const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.AIRPORTS, {
        iata_code: iataCode
      });
      
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data[0];
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ Enhanced airport service failed for ${iataCode}, falling back to direct API:`, error);
      
      // Fallback to direct API call
      const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.AIRPORTS, {
        iata_code: iataCode
      });
      
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data[0];
      }
      
      return null;
    }
  }

  /**
   * Get airline information
   */
  async getAirlineInfo(iataCode: string): Promise<AviationstackAirline | null> {
    console.log(`🔍 Getting airline info for IATA code: ${iataCode}`);
    const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.AIRLINES, {
      iata_code: iataCode
    });
    
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const airline = data.data[0];
      console.log(`✅ Found airline:`, {
        name: airline.airline_name,
        iataCode: airline.iata_code,
        icaoCode: airline.icao_code,
        country: airline.country_name
      });
      return airline;
    } else {
      console.log(`❌ No airline found for IATA code: ${iataCode}`);
      return null;
    }
  }

  /**
   * Get aircraft information by registration
   */
  async getAircraftInfo(registration: string): Promise<AviationstackAircraft | null> {
    const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.AIRPLANES, {
      registration: registration
    });
    
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0];
    }
    
    return null;
  }

  /**
   * Get airline routes
   */
  async getRoutes(params: {
    departureIata?: string;
    arrivalIata?: string;
    airlineIata?: string;
    flightNumber?: string;
  }): Promise<AviationstackRoute[]> {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    const data = await this.makeRequest(API_CONFIG.AVIATIONSTACK.ENDPOINTS.ROUTES, cleanParams);
    
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    return [];
  }

  /**
   * Get flight schedule for a specific flight with smart date detection
   */
  async getFlightSchedule(flightNumber: string, airportCode?: string, type?: 'arrival' | 'departure'): Promise<AviationstackSchedule | null> {
    if (!airportCode || !type) {
      console.warn('⚠️ Airport code and type required for schedule lookup');
      return null;
    }

    // Extract just the flight number (e.g., "6829" from "6E6829")
    const { flightNum } = this.parseFlightNumber(flightNumber);
    
    console.log(`🔍 Searching for flight ${flightNumber} (number: ${flightNum}) at ${airportCode} (${type})`);
    
    // Try multiple approaches to find the flight
    let schedules: AviationstackSchedule[] = [];
    
    // First try with full flight IATA code (most specific)
    schedules = await this.getTimetable({
      iataCode: airportCode,
      type: type,
      flight_iata: flightNumber
    });
    
    // If no results, try with airline code + flight number
    if (schedules.length === 0) {
      const { airlineCode } = this.parseFlightNumber(flightNumber);
      if (airlineCode) {
        console.log(`🔍 No results with full IATA code, trying with airline ${airlineCode} and flight number ${flightNum}`);
        schedules = await this.getTimetable({
          iataCode: airportCode,
          type: type,
          airline_iata: airlineCode || undefined,
          flight_num: flightNum
        });
      }
    }
    
    // Last resort: try with just flight number (less specific)
    if (schedules.length === 0) {
      console.log(`🔍 No results with airline-specific search, trying with just flight number ${flightNum} (may return multiple airlines)`);
      schedules = await this.getTimetable({
        iataCode: airportCode,
        type: type,
        flight_num: flightNum
      });
    }

    console.log(`📊 Found ${schedules.length} schedule entries`);
    
    if (schedules.length > 0) {
      console.log('📋 Sample schedule data:', {
        flightNumber: schedules[0].flight?.iataNumber,
        flightNum: schedules[0].flight?.number,
        airline: schedules[0].airline?.name,
        departure: schedules[0].departure?.iataCode,
        arrival: schedules[0].arrival?.iataCode
      });
    }

    // Find the matching flight (prioritize exact matches)
    const { airlineCode } = this.parseFlightNumber(flightNumber);
    
    const matchingSchedule = schedules.find(schedule => {
      const scheduleFlightNumber = schedule.flight?.iataNumber?.toUpperCase();
      const scheduleAirlineCode = schedule.airline?.iataCode?.toUpperCase();
      
      // First priority: exact IATA flight number match
      if (scheduleFlightNumber === flightNumber.toUpperCase()) {
        return true;
      }
      
      // Second priority: same airline + same flight number
      if (airlineCode && scheduleAirlineCode === airlineCode.toUpperCase() && 
          schedule.flight?.number === flightNum) {
        return true;
      }
      
      // Last resort: ICAO match
      if (schedule.flight?.icaoNumber?.toUpperCase() === flightNumber.toUpperCase()) {
        return true;
      }
      
      return false;
    });

    if (matchingSchedule) {
      console.log('✅ Found matching schedule:', {
        flightNumber: matchingSchedule.flight?.iataNumber,
        airline: matchingSchedule.airline?.name,
        airlineCode: matchingSchedule.airline?.iataCode,
        type: type,
        status: matchingSchedule.status,
        departure: {
          gate: matchingSchedule.departure?.gate,
          terminal: matchingSchedule.departure?.terminal,
          scheduledTime: matchingSchedule.departure?.scheduledTime,
          estimatedTime: matchingSchedule.departure?.estimatedTime,
          actualTime: matchingSchedule.departure?.actualTime,
          delay: matchingSchedule.departure?.delay
        },
        arrival: {
          gate: matchingSchedule.arrival?.gate,
          terminal: matchingSchedule.arrival?.terminal,
          baggage: matchingSchedule.arrival?.baggage,
          scheduledTime: matchingSchedule.arrival?.scheduledTime,
          estimatedTime: matchingSchedule.arrival?.estimatedTime,
          actualTime: matchingSchedule.arrival?.actualTime,
          delay: matchingSchedule.arrival?.delay
        },
        aircraft: matchingSchedule.aircraft
      });
    } else {
      console.log(`❌ No matching schedule found for ${flightNumber} (${airlineCode})`);
      if (schedules.length > 1) {
        console.log('📋 Available flights:', schedules.map(s => 
          `${s.flight?.iataNumber || s.flight?.number} (${s.airline?.iataCode})`
        ));
      }
    }

    return matchingSchedule || null;
  }

  /**
   * Get comprehensive flight information from Aviationstack
   */
  async getComprehensiveFlightInfo(flightNumber: string, departureAirport?: string, arrivalAirport?: string): Promise<{
    schedule?: AviationstackSchedule;
    airline?: AviationstackAirline;
    departureAirport?: AviationstackAirport;
    arrivalAirport?: AviationstackAirport;
    route?: AviationstackRoute;
    live?: AviationstackFlight;
    aircraft?: any;
  }> {
    const result: any = {};

    // Extract airline code from flight number using the helper method
    const { airlineCode } = this.parseFlightNumber(flightNumber);

    // Get airline information
    if (airlineCode) {
      result.airline = await this.getAirlineInfo(airlineCode);
    }

    // Get airport information
    if (departureAirport) {
      result.departureAirport = await this.getAirportInfo(departureAirport);
      
      // Try to get departure schedule
      const depSchedule = await this.getFlightSchedule(flightNumber, departureAirport, 'departure');
      if (depSchedule) {
        result.schedule = depSchedule;
        // Extract aircraft info from schedule if available
        if (depSchedule.aircraft && !result.aircraft) {
          result.aircraft = depSchedule.aircraft;
          console.log(`✈️ Found aircraft info from departure schedule:`, {
            registration: depSchedule.aircraft.registration,
            type: depSchedule.aircraft.type || depSchedule.aircraft.modelCode,
            model: depSchedule.aircraft.model || depSchedule.aircraft.modelText
          });
        }
      }
    }

    if (arrivalAirport) {
      result.arrivalAirport = await this.getAirportInfo(arrivalAirport);
      
      // Try to get arrival schedule if we don't have departure
      if (!result.schedule) {
        const arrSchedule = await this.getFlightSchedule(flightNumber, arrivalAirport, 'arrival');
        if (arrSchedule) {
          result.schedule = arrSchedule;
        }
      }
    }

    // Get route information
    if (departureAirport && arrivalAirport && airlineCode) {
      const routes = await this.getRoutes({
        departureIata: departureAirport,
        arrivalIata: arrivalAirport,
        airlineIata: airlineCode
      });
      if (routes.length > 0) {
        result.route = routes[0];
      }
    }

    // Get live flight data
    const liveFlights = await this.getFlights({
      flight_iata: flightNumber,
      limit: '1'
    });
    if (liveFlights.length > 0) {
      result.live = liveFlights[0];
    }

    return result;
  }

  /**
   * Get future flight by number with optional airport constraints
   */
  async getFutureFlightByNumber(
    flightNumber: string,
    targetDate: Date,
    departureAirport?: string,
    arrivalAirport?: string
  ): Promise<AviationstackSchedule | null> {
    try {
      console.log(`🔮 Getting future flight ${flightNumber} for ${targetDate.toISOString()}`);
      
      const dateStr = targetDate.toISOString().split('T')[0];
      const { airlineCode, flightNum } = this.parseFlightNumber(flightNumber);
      
      // Try departure airport first if available
      if (departureAirport) {
        console.log(`📅 Checking future departure from ${departureAirport}`);
        const depResults = await this.getFutureFlights({
          iataCode: departureAirport,
          type: 'departure',
          date: dateStr,
          flight_number: flightNum,
          airline_iata: airlineCode || undefined
        });
        
        const match = depResults.find(f => 
          f.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
          f.flight?.number === flightNum
        );
        
        if (match) {
          console.log(`✅ Found future flight in departure data`);
          return match as AviationstackSchedule;
        }
      }
      
      // Try arrival airport if available
      if (arrivalAirport) {
        console.log(`📅 Checking future arrival at ${arrivalAirport}`);
        const arrResults = await this.getFutureFlights({
          iataCode: arrivalAirport,
          type: 'arrival',
          date: dateStr,
          flight_number: flightNum,
          airline_iata: airlineCode || undefined
        });
        
        const match = arrResults.find(f => 
          f.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
          f.flight?.number === flightNum
        );
        
        if (match) {
          console.log(`✅ Found future flight in arrival data`);
          return match as AviationstackSchedule;
        }
      }
      
      console.log(`❌ No future flight data found for ${flightNumber} on ${dateStr}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting future flight ${flightNumber}:`, error);
      return null;
    }
  }

  /**
   * Get historical flight by number with optional airport constraints
   */
  async getHistoricalFlightByNumber(
    flightNumber: string,
    targetDate: Date,
    departureAirport?: string,
    arrivalAirport?: string
  ): Promise<AviationstackSchedule | null> {
    try {
      console.log(`📅 Getting historical flight ${flightNumber} for ${targetDate.toISOString()}`);
      
      const dateStr = targetDate.toISOString().split('T')[0];
      const { airlineCode, flightNum } = this.parseFlightNumber(flightNumber);
      
      // Try departure airport first if available
      if (departureAirport) {
        console.log(`📅 Checking historical departure from ${departureAirport}`);
        const depResults = await this.getHistoricalFlights({
          flight_date: dateStr,
          dep_iata: departureAirport,
          flight_iata: flightNumber,
          airline_iata: airlineCode || undefined
        });
        
        const match = depResults.find(f => 
          f.flight?.iata?.toUpperCase() === flightNumber.toUpperCase() ||
          f.flight?.number === flightNum
        );
        
        if (match) {
          console.log(`✅ Found historical flight in departure data`);
          return match as AviationstackSchedule;
        }
      }
      
      // Try arrival airport if available
      if (arrivalAirport) {
        console.log(`📅 Checking historical arrival at ${arrivalAirport}`);
        const arrResults = await this.getHistoricalFlights({
          flight_date: dateStr,
          arr_iata: arrivalAirport,
          flight_iata: flightNumber,
          airline_iata: airlineCode || undefined
        });
        
        const match = arrResults.find(f => 
          f.flight?.iata?.toUpperCase() === flightNumber.toUpperCase() ||
          f.flight?.number === flightNum
        );
        
        if (match) {
          console.log(`✅ Found historical flight in arrival data`);
          return match as AviationstackSchedule;
        }
      }
      
      console.log(`❌ No historical flight data found for ${flightNumber} on ${dateStr}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting historical flight ${flightNumber}:`, error);
      return null;
    }
  }

  /**
   * Test API connection
   */
  async testAPIConnection(): Promise<boolean> {
    console.log('🧪 Testing Aviationstack API connection...');
    
    try {
      // Test with a simple airline lookup
      const testUrl = `${API_CONFIG.AVIATIONSTACK.BASE_URL}${API_CONFIG.AVIATIONSTACK.ENDPOINTS.AIRLINES}?access_key=${API_CONFIG.AVIATIONSTACK.API_KEY}&iata_code=AA`;
      
      let response: Response;
      
      // Try direct request first
      try {
        response = await fetch(testUrl);
        if (response.ok) {
          console.log('✅ Direct API connection successful');
          return true;
        }
      } catch (directError) {
        console.log('⚠️ Direct connection failed, trying CORS proxy...');
      }
      
      // Try with CORS proxy
      try {
        response = await corsProxyService.fetchWithProxy(testUrl);
        if (response.ok) {
          console.log('✅ CORS proxy connection successful');
          return true;
        }
      } catch (proxyError) {
        console.log('❌ CORS proxy connection failed:', proxyError);
      }
      
      console.log('❌ All connection methods failed');
      return false;
    } catch (error) {
      console.error('❌ API connection test error:', error);
      return false;
    }
  }
}

export default new AviationstackService();
