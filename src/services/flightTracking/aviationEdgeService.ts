/**
 * Aviation Edge API Service
 * Professional service for interacting with Aviation Edge API endpoints
 */

import { API_CONFIG } from '@/config/apiConfig';
import corsProxyService from './corsProxyService';
import appwriteProxyService from './appwriteProxyService';

// Aviation Edge API Response Types
export interface AviationEdgeSchedule {
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

export interface AviationEdgeAirport {
  airportId?: number;
  nameAirport?: string;
  codeIataAirport?: string;
  codeIcaoAirport?: string;
  codeIataCity?: string;
  nameCountry?: string;
  codeIso2Country?: string;
  latitudeAirport?: number;
  longitudeAirport?: number;
  timezone?: string;
  GMT?: string;
  phone?: string;
  geonameId?: string;
}

export interface AviationEdgeAirline {
  airlineId?: number;
  nameAirline?: string;
  codeIataAirline?: string;
  codeIcaoAirline?: string;
  callsign?: string;
  statusAirline?: string;
  sizeAirline?: number;
  ageFleet?: number;
  founding?: number;
  codeHub?: string;
  nameCountry?: string;
  codeIso2Country?: string;
}

export interface AviationEdgeAircraft {
  airplaneId?: number;
  numberRegistration?: string;
  productionLine?: string;
  airplaneIataType?: string;
  planeModel?: string;
  modelCode?: string;
  hexIcaoAirplane?: string;
  codeIataPlaneShort?: string;
  codeIataPlaneLong?: string;
  constructionNumber?: string;
  numberTestRgistration?: string;
  rolloutDate?: string;
  firstFlight?: string;
  deliveryDate?: string;
  registrationDate?: string;
  lineNumber?: string;
  planeSeries?: string;
  codeIataAirline?: string;
  codeIcaoAirline?: string;
  planeOwner?: string;
  enginesCount?: string;
  enginesType?: string;
  planeAge?: string;
  planeStatus?: string;
  planeClass?: string;
}

export interface AviationEdgeRoute {
  departureIata?: string;
  departureIcao?: string;
  departureTerminal?: string;
  departureTime?: string;
  arrivalIata?: string;
  arrivalIcao?: string;
  arrivalTerminal?: string;
  arrivalTime?: string;
  airlineIata?: string;
  airlineIcao?: string;
  flightNumber?: string;
  codeshares?: string;
  regNumber?: string;
}

export interface AviationEdgeFlight {
  aircraft?: {
    iataCode?: string;
    icao24?: string;
    icaoCode?: string;
    regNumber?: string;
  };
  airline?: {
    iataCode?: string;
    icaoCode?: string;
  };
  arrival?: {
    iataCode?: string;
    icaoCode?: string;
  };
  departure?: {
    iataCode?: string;
    icaoCode?: string;
  };
  flight?: {
    iataNumber?: string;
    icaoNumber?: string;
    number?: string;
  };
  geography?: {
    altitude?: number;
    direction?: number;
    latitude?: number;
    longitude?: number;
  };
  speed?: {
    horizontal?: number;
    isGround?: number;
    vspeed?: number;
  };
  status?: string;
  system?: {
    squawk?: number;
    updated?: number;
  };
}

class AviationEdgeService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = API_CONFIG.AVIATION_EDGE.API_KEY;
    this.baseUrl = API_CONFIG.AVIATION_EDGE.BASE_URL;
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
    
    console.log(`🔍 Flight parsing: ${flightNumber} -> Airline: ${airlineCode}, Flight Number: ${flightNum}`);
    
    return { airlineCode, flightNum };
  }

  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<any> {
    try {
      const queryParams = new URLSearchParams({ key: this.apiKey, ...params });
      const url = `${this.baseUrl}${endpoint}?${queryParams}`;
      
      console.log('📡 Aviation Edge API Request:', url.replace(this.apiKey, 'API_KEY'));

      // Priority 1: Try direct API call first
      try {
        console.log('🔗 Attempting direct API call...');
        const directResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (directResponse.ok) {
          const data = await directResponse.json();
          
          // Check for API error responses
          if (data.error || data.success === false) {
            console.log(`⚠️ Aviation Edge API returned error:`, data);
            return data; // Return the error data so we can handle it
          }
          
          console.log('✅ Direct API call successful');
          return data;
        } else {
          console.log(`⚠️ Direct API call failed: ${directResponse.status} ${directResponse.statusText}`);
        }
      } catch (directError) {
        console.log('⚠️ Direct API call failed:', directError.message);
      }

      // Priority 2: Try Appwrite proxy if available
      if (appwriteProxyService.isAvailable()) {
        console.log('🚀 Falling back to Appwrite proxy...');
        
        // Convert endpoint path to Appwrite function endpoint name
        let appwriteEndpoint = endpoint.replace('/', '');
        if (appwriteEndpoint === 'timetable') {
          appwriteEndpoint = 'timetable';
        } else if (appwriteEndpoint === 'airlineDatabase') {
          appwriteEndpoint = 'airlineDatabase';
        } else if (appwriteEndpoint === 'airplaneDatabase') {
          appwriteEndpoint = 'airplaneDatabase';
        } else if (appwriteEndpoint === 'airportDatabase') {
          appwriteEndpoint = 'airportDatabase';
        } else if (appwriteEndpoint === 'cityDatabase') {
          appwriteEndpoint = 'cityDatabase';
        }
        
        try {
          const data = await appwriteProxyService.makeRequest(appwriteEndpoint, params);
          console.log('✅ Appwrite proxy request successful');
          return data;
        } catch (appwriteError) {
          console.log('⚠️ Appwrite proxy failed, falling back to CORS proxy:', appwriteError);
        }
      } else {
        console.log('⚠️ Appwrite proxy not available');
      }

      // Priority 3: Final fallback to CORS proxy
      console.log('🌐 Final fallback: using CORS proxy service');
      let response: Response;
      
      if (corsProxyService.isCORSProxyNeeded()) {
        response = await corsProxyService.fetchWithProxy(url);
      } else {
        response = await fetch(url);
      }

      if (!response.ok) {
        console.error(`❌ Aviation Edge API Error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      // Check for API error responses
      if (data.error || data.success === false) {
        console.log(`⚠️ Aviation Edge API returned error:`, data);
        return data; // Return the error data so we can handle it
      }
      
      console.log('✅ CORS proxy response successful');
      return data;
    } catch (error) {
      console.error('❌ Aviation Edge Service Error:', error);
      return null;
    }
  }

  /**
   * Get airport timetable (arrivals or departures) - Enhanced version
   * Uses the full Aviation Edge /timetable API with all available parameters
   */
  async getAirportTimetable(params: {
    iataCode: string;
    type: 'arrival' | 'departure';
    status?: string;
    airline_iata?: string;
    airline_icao?: string;
    airline_name?: string;
    flight_num?: string;
    flight_iata?: string;
    flight_icao?: string;
    dep_terminal?: string;
    arr_terminal?: string;
    dep_delay?: string;
    arr_delay?: string;
    dep_schTime?: string;
    dep_estTime?: string;
    dep_actTime?: string;
    arr_schTime?: string;
    arr_estTime?: string;
    arr_actTime?: string;
    lang?: string;
  }): Promise<AviationEdgeSchedule[]> {
    console.log(`📡 Aviation Edge Timetable API call with params:`, {
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

    const data = await this.makeRequest(API_CONFIG.AVIATION_EDGE.ENDPOINTS.TIMETABLE, cleanParams);
    
    if (Array.isArray(data)) {
      console.log(`✅ Aviation Edge Timetable API returned ${data.length} schedules`);
      
      // Log sample response structure for verification
      if (data.length > 0) {
        const sample = data[0];
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
      
      return data;
    }
    
    console.warn(`⚠️ Aviation Edge Timetable API returned non-array data:`, data);
    return [];
  }

  /**
   * Get flight schedule for a specific flight with smart date detection
   */
  async getFlightSchedule(flightNumber: string, airportCode?: string, type?: 'arrival' | 'departure', date?: Date): Promise<AviationEdgeSchedule | null> {
    if (!airportCode || !type) {
      console.warn('⚠️ Airport code and type required for schedule lookup');
      return null;
    }

    // Extract just the flight number (e.g., "6829" from "6E6829")
    const { flightNum } = this.parseFlightNumber(flightNumber);
    
    console.log(`🔍 Searching for flight ${flightNumber} (number: ${flightNum}) at ${airportCode} (${type}) for date: ${date?.toISOString()}`);
    
    // Try multiple approaches to find the flight
    let schedules: AviationEdgeSchedule[] = [];
    
    // First try with full flight IATA code (most specific)
    schedules = await this.getAirportTimetable({
      iataCode: airportCode,
      type: type,
      flight_iata: flightNumber
    });
    
    // If no results, try with airline code + flight number
    if (schedules.length === 0) {
      const { airlineCode } = this.parseFlightNumber(flightNumber);
      if (airlineCode) {
        console.log(`🔍 No results with full IATA code, trying with airline ${airlineCode} and flight number ${flightNum}`);
        schedules = await this.getAirportTimetable({
          iataCode: airportCode,
          type: type,
          airline_iata: airlineCode,
          flight_num: flightNum
        });
      }
    }
    
    // Last resort: try with just flight number (less specific)
    if (schedules.length === 0) {
      console.log(`🔍 No results with airline-specific search, trying with just flight number ${flightNum} (may return multiple airlines)`);
      schedules = await this.getAirportTimetable({
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
   * Get airport timetable with extended time range and smart filtering
   */
  async getAirportTimetableExtended(params: {
    iataCode: string;
    type: 'arrival' | 'departure';
    status?: string;
    airline_iata?: string;
    flight_num?: string;
    date?: string;
    timeRange?: 'current' | 'past' | 'future' | 'custom';
    hoursOffset?: number; // For custom time range
  }): Promise<AviationEdgeSchedule[]> {
    const data = await this.makeRequest(API_CONFIG.AVIATION_EDGE.ENDPOINTS.TIMETABLE, params);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get current airport timetable (current time +4 hours only, no past hours)
   * Uses proper Aviation Edge API parameters without date parameter
   */
  async getCurrentAirportTimetable(
    iataCode: string, 
    type: 'arrival' | 'departure',
    hoursOffset: number = 4
  ): Promise<AviationEdgeSchedule[]> {
    const now = new Date();
    // Only show current time +4 hours (no past hours)
    const from = now; // Start from current time
    const to = new Date(now.getTime() + (hoursOffset * 60 * 60 * 1000));
    
    console.log(`🕐 Getting current timetable for ${iataCode} (${type}) from ${from.toISOString()} to ${to.toISOString()}`);
    console.log(`📅 Time range: Current time +${hoursOffset} hours (no past hours)`);
    
    // Use the enhanced timetable endpoint WITHOUT date parameter (as per API docs)
    const schedules = await this.getEnhancedAirportTimetable({
      iataCode: iataCode,
      type: type
    });
    
    console.log(`📊 Raw schedules from API: ${schedules.length}`);
    
    // Filter by time range - ONLY FUTURE TIMES
    const filteredSchedules = schedules.filter(schedule => {
      let scheduledTime: string | undefined;
      
      if (type === 'departure') {
        scheduledTime = schedule.departure?.scheduledTime || schedule.departure?.estimatedTime || schedule.departure?.actualTime;
      } else {
        scheduledTime = schedule.arrival?.scheduledTime || schedule.arrival?.estimatedTime || schedule.arrival?.actualTime;
      }
      
      if (!scheduledTime) {
        console.log(`⚠️ No scheduled time for flight ${schedule.flight?.iataNumber || schedule.flight?.number}`);
        return false;
      }
      
      const scheduleTime = new Date(scheduledTime);
      const isInFuture = scheduleTime >= from;
      const isInRange = scheduleTime <= to;
      
      if (!isInFuture) {
        console.log(`⏰ Skipping past flight: ${schedule.flight?.iataNumber || schedule.flight?.number} at ${scheduleTime.toISOString()}`);
      }
      
      return isInFuture && isInRange;
    });
    
    console.log(`📊 Found ${filteredSchedules.length} current flights in time range for ${iataCode} (${type})`);
    console.log(`✅ Filtered out ${schedules.length - filteredSchedules.length} past flights`);
    
    return filteredSchedules;
  }

  /**
   * Get airport timetable with date parameter
   */
  async getAirportTimetableWithDate(
    iataCode: string,
    type: 'arrival' | 'departure',
    date: Date
  ): Promise<AviationEdgeSchedule[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    console.log(`📅 Getting timetable for ${iataCode} (${type}) on ${dateStr}`);
    
    return await this.getAirportTimetable({
      iataCode,
      type,
      date: dateStr
    });
  }

  /**
   * Get historical airport timetable
   */
  async getHistoricalAirportTimetable(
    iataCode: string,
    type: 'arrival' | 'departure',
    date: Date,
    hoursOffset: number = 4
  ): Promise<AviationEdgeSchedule[]> {
    const dateStr = date.toISOString().split('T')[0];
    const from = new Date(date.getTime() - (hoursOffset * 60 * 60 * 1000));
    const to = new Date(date.getTime() + (hoursOffset * 60 * 60 * 1000));
    
    console.log(`📅 Getting historical timetable for ${iataCode} (${type}) on ${dateStr} from ${from.toISOString()} to ${to.toISOString()}`);
    
    // Use historical API for past dates
    const historicalSchedules = await this.getHistoricalFlight({
      code: iataCode,
      type,
      date_from: dateStr,
      date_to: dateStr
    });
    
    // Filter by time range
    const filteredSchedules = historicalSchedules.filter(schedule => {
      const scheduledTime = schedule.departure?.scheduledTime || schedule.arrival?.scheduledTime;
      if (!scheduledTime) return false;
      
      const scheduleTime = new Date(scheduledTime);
      return scheduleTime >= from && scheduleTime <= to;
    });
    
    console.log(`📊 Found ${filteredSchedules.length} historical flights in time range`);
    return filteredSchedules;
  }

  /**
   * Get future airport timetable
   */
  async getFutureAirportTimetable(
    iataCode: string,
    type: 'arrival' | 'departure',
    date: Date,
    hoursOffset: number = 4
  ): Promise<AviationEdgeSchedule[]> {
    const dateStr = date.toISOString().split('T')[0];
    const from = new Date(date.getTime() - (hoursOffset * 60 * 60 * 1000));
    const to = new Date(date.getTime() + (hoursOffset * 60 * 60 * 1000));
    
    console.log(`🔮 Getting future timetable for ${iataCode} (${type}) on ${dateStr} from ${from.toISOString()} to ${to.toISOString()}`);
    
    // Use future API for upcoming dates
    const futureSchedules = await this.getFutureFlight({
      iataCode,
      type,
      date: dateStr
    });
    
    // Filter by time range
    const filteredSchedules = futureSchedules.filter(schedule => {
      const scheduledTime = schedule.departure?.scheduledTime || schedule.arrival?.scheduledTime;
      if (!scheduledTime) return false;
      
      const scheduleTime = new Date(scheduledTime);
      return scheduleTime >= from && scheduleTime <= to;
    });
    
    console.log(`📊 Found ${filteredSchedules.length} future flights in time range`);
    return filteredSchedules;
  }

  /**
   * Get airport information
   */
  async getAirportInfo(iataCode: string): Promise<AviationEdgeAirport | null> {
    const data = await this.makeRequest(API_CONFIG.AVIATION_EDGE.ENDPOINTS.AIRPORT_DATABASE, {
      codeIataAirport: iataCode
    });
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  /**
   * Get airline information
   */
  async getAirlineInfo(iataCode: string): Promise<AviationEdgeAirline | null> {
    console.log(`🔍 Getting airline info for IATA code: ${iataCode}`);
    const data = await this.makeRequest(API_CONFIG.AVIATION_EDGE.ENDPOINTS.AIRLINE_DATABASE, {
      codeIataAirline: iataCode
    });
    
    if (Array.isArray(data) && data.length > 0) {
      const airline = data[0];
      console.log(`✅ Found airline:`, {
        name: airline.nameAirline,
        iataCode: airline.codeIataAirline,
        icaoCode: airline.codeIcaoAirline,
        country: airline.nameCountry
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
  async getAircraftInfo(registration: string): Promise<AviationEdgeAircraft | null> {
    const data = await this.makeRequest(API_CONFIG.AVIATION_EDGE.ENDPOINTS.AIRCRAFT_DATABASE, {
      registration: registration  // Changed from numberRegistration to registration
    });
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  /**
   * Get historical flight data using flightsHistory API
   */
  async getHistoricalFlight(params: {
    code: string;
    type: 'departure' | 'arrival';
    date_from: string;
    date_to?: string;
    airline_iata?: string;
    flight_num?: string;
  }): Promise<any[]> {
    console.log(`📅 Getting historical flight data:`, params);
    const data = await this.makeRequest('/flightsHistory', params);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get specific historical flight by flight number and date
   */
  async getHistoricalFlightByNumber(
    flightNumber: string, 
    date: Date, 
    departureAirport?: string, 
    arrivalAirport?: string
  ): Promise<any | null> {
    const dateStr = date.toISOString().split('T')[0];
    const { airlineCode, flightNum } = this.parseFlightNumber(flightNumber);
    
    console.log(`🔍 Looking for historical flight ${flightNumber} on ${dateStr}`);
    
    // Try departure airport first if available
    if (departureAirport) {
      console.log(`📅 Checking departure from ${departureAirport}`);
      const depResults = await this.getHistoricalFlight({
        code: departureAirport,
        type: 'departure',
        date_from: dateStr,
        date_to: dateStr,
        flight_num: flightNum,
        airline_iata: airlineCode
      });
      
      const match = depResults.find(f => 
        f.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
        f.flight?.number === flightNum
      );
      
      if (match) {
        console.log(`✅ Found historical flight in departure data`);
        return match;
      }
    }
    
    // Try arrival airport if available
    if (arrivalAirport) {
      console.log(`📅 Checking arrival at ${arrivalAirport}`);
      const arrResults = await this.getHistoricalFlight({
        code: arrivalAirport,
        type: 'arrival',
        date_from: dateStr,
        date_to: dateStr,
        flight_num: flightNum,
        airline_iata: airlineCode
      });
      
      const match = arrResults.find(f => 
        f.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
        f.flight?.number === flightNum
      );
      
      if (match) {
        console.log(`✅ Found historical flight in arrival data`);
        return match;
      }
    }
    
    // If no specific airports, try common hub airports for the airline
    if (airlineCode) {
      const airlineInfo = await this.getAirlineInfo(airlineCode);
      const hubAirports = airlineInfo?.codeHub ? [airlineInfo.codeHub] : ['JFK', 'LHR', 'CDG', 'DXB', 'DEL'];
      
      console.log(`🔍 Searching historical data in hub airports: ${hubAirports.join(', ')}`);
      
      for (const airport of hubAirports) {
        try {
          const [depResults, arrResults] = await Promise.all([
            this.getHistoricalFlight({
              code: airport,
              type: 'departure',
              date_from: dateStr,
              date_to: dateStr,
              flight_num: flightNum,
              airline_iata: airlineCode
            }),
            this.getHistoricalFlight({
              code: airport,
              type: 'arrival',
              date_from: dateStr,
              date_to: dateStr,
              flight_num: flightNum,
              airline_iata: airlineCode
            })
          ]);
          
          const allResults = [...depResults, ...arrResults];
          const match = allResults.find(f => 
            f.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
            f.flight?.number === flightNum
          );
          
          if (match) {
            console.log(`✅ Found historical flight at ${airport}`);
            return match;
          }
        } catch (error) {
          console.log(`⚠️ Error searching historical data at ${airport}:`, error);
          continue;
        }
      }
    }
    
    console.log(`❌ No historical flight data found for ${flightNumber} on ${dateStr}`);
    return null;
  }

  /**
   * Get future flight schedules using flightsFuture API
   */
  async getFutureFlight(params: {
    iataCode: string;
    type: 'departure' | 'arrival';
    date: string;
    airline_iata?: string;
    airline_icao?: string;
    flight_num?: string;
    arr_iataCode?: string;  // For filtering flights to specific arrival airport
    dep_iataCode?: string;  // For filtering flights from specific departure airport
  }): Promise<any[]> {
    console.log(`📅 Getting future flight data using /flightsFuture endpoint:`, params);
    
    // Prepare API parameters according to Aviation Edge Future Schedules API documentation
    const apiParams: any = {
      iataCode: params.iataCode,
      type: params.type,
      date: params.date
    };
    
    // Add optional filters
    if (params.airline_iata) apiParams.airline_iata = params.airline_iata;
    if (params.airline_icao) apiParams.airline_icao = params.airline_icao;
    if (params.flight_num) apiParams.flight_num = params.flight_num;
    if (params.arr_iataCode) apiParams.arr_iataCode = params.arr_iataCode;
    if (params.dep_iataCode) apiParams.dep_iataCode = params.dep_iataCode;
    
    console.log(`📡 Aviation Edge Future API call:`, apiParams);
    
    const data = await this.makeRequest('/flightsFuture', apiParams);
    
    console.log(`🔍 Raw API response for /flightsFuture:`, data);
    
    if (Array.isArray(data)) {
      console.log(`✅ Found ${data.length} future flight results`);
      
      // Filter out codeshare flights to avoid duplicates and confusion
      const filteredData = data.filter(flight => {
        const hasCodeshare = flight.codeshared && (
          flight.codeshared.airline?.iataCode || 
          flight.codeshared.flight?.iataNumber
        );
        
        if (hasCodeshare) {
          console.log(`🔗 Filtering out codeshare: ${flight.flight?.iataNumber} (marketed by ${flight.airline?.name}) → operated by ${flight.codeshared.flight?.iataNumber} (${flight.codeshared.airline?.name})`);
          return false;
        }
        return true;
      });
      
      console.log(`📊 After codeshare filtering: ${data.length} → ${filteredData.length} flights`);
      
      // Log the first few results for debugging
      if (filteredData.length > 0) {
        console.log(`🔍 First result details:`, {
          flight: filteredData[0].flight,
          airline: filteredData[0].airline,
          departure: filteredData[0].departure,
          arrival: filteredData[0].arrival
        });
      }
      
      return filteredData;
    } else {
      console.log(`⚠️ No future flight data returned or invalid format:`, data);
      return [];
    }
  }

  /**
   * Search future flights by route (departure -> arrival airports)
   * This is the preferred method when user selects future dates
   */
  async getFutureFlightByRoute(params: {
    flightNumber: string;
    date: string;
    departureAirport: string;
    arrivalAirport?: string;
  }): Promise<AviationEdgeSchedule | null> {
    const { flightNumber, date, departureAirport, arrivalAirport } = params;
    
    console.log(`🎯 Searching future flight ${flightNumber} on ${date} from ${departureAirport}${arrivalAirport ? ` to ${arrivalAirport}` : ''}`);
    
    // Check if date is far enough in the future for Aviation Edge API
    const selectedDate = new Date(date);
    const now = new Date();
    const daysDiff = (selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    console.log(`📅 Date validation: Selected: ${date}, Current: ${now.toISOString().split('T')[0]}, Days ahead: ${daysDiff.toFixed(1)}`);
    
    // Aviation Edge Future API requires dates to be at least 7 days ahead
    if (daysDiff < 7) {
      console.log(`⚠️ Date ${date} is only ${daysDiff.toFixed(1)} days ahead. Aviation Edge Future API requires at least 7 days.`);
      console.log(`🔄 Falling back to current timetable search for near-future flights...`);
      
      // For dates less than 7 days ahead, use current timetable instead
      try {
        const currentSchedules = await this.getCurrentAirportTimetable(departureAirport, 'departure', 24);
        
        // Filter for the specific flight and date
        const matchingFlight = currentSchedules.find(schedule => {
          const scheduleDate = new Date(schedule.departure?.scheduledTime || '');
          const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
          
          return schedule.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() &&
                 scheduleDateStr === date;
        });
        
        if (matchingFlight) {
          console.log(`✅ Found near-future flight in current timetable: ${matchingFlight.flight?.iataNumber}`);
          return matchingFlight;
        }
      } catch (error) {
        console.log(`⚠️ Current timetable fallback failed:`, error);
      }
      
      // FINAL FALLBACK: Try to find the flight in current schedules for Indian carriers
      if (airlineCode && ['6E', 'AI', '9W', 'SG', 'UK'].includes(airlineCode)) {
        console.log(`🔄 Final fallback: Checking current schedules for Indian carrier ${airlineCode}...`);
        
        try {
          const currentSchedules = await this.getCurrentAirportTimetable(departureAirport, 'departure', 48);
          
          // Look for flights with matching number pattern
          const matchingFlight = currentSchedules.find(schedule => {
            const scheduleFlightNum = schedule.flight?.number || 
                                    schedule.flight?.iataNumber?.replace(/^[A-Z0-9]{2,3}/i, '');
            return scheduleFlightNum === flightNumOnly;
          });
          
          if (matchingFlight) {
            console.log(`✅ Found Indian carrier flight in current schedules: ${matchingFlight.flight?.iataNumber}`);
            return matchingFlight;
          }
        } catch (error) {
          console.log(`⚠️ Current schedule fallback failed:`, error);
        }
      }
      
      return null;
    }
    
    // Extract airline code and flight number using helper function
    const { airlineCode, flightNum: flightNumOnly } = this.parseFlightNumber(flightNumber);
    
    console.log(`🔍 Flight parsing: ${flightNumber} -> Airline: ${airlineCode}, Flight Number: ${flightNumOnly}`);
    
    try {
      // Search in departure airport schedules
      const searchParams: any = {
        iataCode: departureAirport,
        type: 'departure' as const,
        date: date,
        flight_num: flightNumOnly
      };
      
      // Add airline filter if available
      if (airlineCode) {
        searchParams.airline_iata = airlineCode;
      }
      
      // Add arrival airport filter if specified
      if (arrivalAirport) {
        searchParams.arr_iataCode = arrivalAirport;
      }
      
      console.log(`📡 Future flight search params:`, searchParams);
      
      const results = await this.getFutureFlight(searchParams);
      
      if (results && results.length > 0) {
        console.log(`📊 Found ${results.length} future flight results`);
        
        // Log all results for debugging
        results.forEach((flight, index) => {
          console.log(`🔍 Future result ${index + 1}: ${flight.flight?.iataNumber || flight.flight?.number} (${flight.airline?.iataCode || flight.airline?.name})`);
        });
        
        // Find exact flight match
        const exactMatch = results.find(flight => {
          const matchesFlightNumber = 
            flight.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
            flight.flight?.number === flightNumOnly;
          
          const matchesRoute = !arrivalAirport || 
            flight.arrival?.iataCode?.toUpperCase() === arrivalAirport.toUpperCase();
          
          console.log(`🔍 Checking ${flight.flight?.iataNumber || flight.flight?.number}: flight match: ${matchesFlightNumber}, route match: ${matchesRoute}`);
          
          return matchesFlightNumber && matchesRoute;
        });
        
        if (exactMatch) {
          console.log(`✅ Found exact future flight match: ${exactMatch.flight?.iataNumber} (${exactMatch.airline?.iataCode})`);
          return exactMatch;
        } else {
          console.log(`⚠️ Found ${results.length} flights but no exact match for ${flightNumber}`);
          console.log(`⚠️ Returning first result as fallback: ${results[0].flight?.iataNumber} (${results[0].airline?.iataCode})`);
          // Return the first result as a fallback
          return results[0];
        }
      }
      
      console.log(`❌ No future flight found for ${flightNumber} from ${departureAirport}`);
      
      // FALLBACK: Search for all flights on the route with the airline
      if (airlineCode && arrivalAirport) {
        console.log(`🔄 Fallback: Searching for all ${airlineCode} flights on route ${departureAirport} → ${arrivalAirport}...`);
        
        try {
          const routeSearchParams = {
            iataCode: departureAirport,
            type: 'departure' as const,
            date: date,
            airline_iata: airlineCode,
            arr_iataCode: arrivalAirport
          };
          
          console.log(`📡 Route-based search params:`, routeSearchParams);
          const routeResults = await this.getFutureFlight(routeSearchParams);
          
          if (routeResults && routeResults.length > 0) {
            console.log(`📊 Found ${routeResults.length} ${airlineCode} flights on this route`);
            
            // Log all flights found
            routeResults.forEach((flight, index) => {
              console.log(`🔍 Route flight ${index + 1}: ${flight.flight?.iataNumber || flight.flight?.number} at ${flight.departure?.scheduledTime}`);
            });
            
            // Try to find the specific flight by number
            const specificFlight = routeResults.find(flight => {
              const flightNum = flight.flight?.number || flight.flight?.iataNumber?.replace(/^[A-Z0-9]{2,3}/i, '');
              return flightNum === flightNumOnly;
            });
            
            if (specificFlight) {
              console.log(`✅ Found specific flight ${flightNumber} in route results`);
              return specificFlight;
            } else {
              console.log(`⚠️ Specific flight ${flightNumber} not found, but found ${routeResults.length} other ${airlineCode} flights on this route`);
              // You could return the first flight as a suggestion or null
              // return routeResults[0]; // Uncomment to return first flight as fallback
            }
          }
        } catch (error) {
          console.log(`⚠️ Route-based search failed:`, error);
        }
      }
      
      // UNIVERSAL FALLBACK: Try alternative search methods for ANY airline when specific flight not found
      if (airlineCode) {
        console.log(`✈️ Trying alternative search methods for ${airlineCode} (specific flight ${flightNumber} not found)...`);
        
        try {
          // Try searching without airline filter (sometimes specific flight numbers aren't in Future API)
          const searchParamsWithoutAirline = {
            iataCode: departureAirport,
            type: 'departure' as const,
            date: date,
            flight_num: flightNumOnly
          };
          
          if (arrivalAirport) {
            searchParamsWithoutAirline.arr_iataCode = arrivalAirport;
          }
          
          console.log(`🔄 Trying search without airline filter:`, searchParamsWithoutAirline);
          const resultsWithoutAirline = await this.getFutureFlight(searchParamsWithoutAirline);
          
          if (resultsWithoutAirline && resultsWithoutAirline.length > 0) {
            console.log(`📊 Found ${resultsWithoutAirline.length} flights without airline filter`);
            
            // Log all results for debugging
            resultsWithoutAirline.forEach((flight, index) => {
              console.log(`🔍 Result ${index + 1}: ${flight.flight?.iataNumber || flight.flight?.number} (${flight.airline?.iataCode || flight.airline?.name})`);
            });
            
            // Find flight by number only (without airline code)
            const flightMatch = resultsWithoutAirline.find(flight => {
              const flightNum = flight.flight?.number || flight.flight?.iataNumber?.replace(/^[A-Z0-9]{2,3}/i, '');
              const matchesFlight = flightNum === flightNumOnly;
              console.log(`🔍 Checking ${flight.flight?.iataNumber || flight.flight?.number}: flight number ${flightNum} matches ${flightNumOnly}? ${matchesFlight}`);
              return matchesFlight;
            });
            
            if (flightMatch) {
              console.log(`✅ Found flight without airline filter: ${flightMatch.flight?.iataNumber} (${flightMatch.airline?.iataCode})`);
              return flightMatch;
            }
          }
          
          // Try searching with just the flight number (no airline code)
          console.log(`🔄 Trying search with just flight number: ${flightNumOnly}`);
          const searchParamsFlightOnly = {
            iataCode: departureAirport,
            type: 'departure' as const,
            date: date,
            flight_num: flightNumOnly
          };
          
          const resultsFlightOnly = await this.getFutureFlight(searchParamsFlightOnly);
          if (resultsFlightOnly && resultsFlightOnly.length > 0) {
            console.log(`📊 Found ${resultsFlightOnly.length} flights with flight number only`);
            
            // Log all results for debugging
            resultsFlightOnly.forEach((flight, index) => {
              console.log(`🔍 Flight-only result ${index + 1}: ${flight.flight?.iataNumber || flight.flight?.number} (${flight.airline?.iataCode || flight.airline?.name})`);
            });
            
            console.log(`✅ Found flight with number-only search: ${resultsFlightOnly[0].flight?.iataNumber} (${resultsFlightOnly[0].airline?.iataCode})`);
            return resultsFlightOnly[0];
          }
          
        } catch (error) {
          console.log(`⚠️ Alternative search methods failed:`, error);
        }
      }
      
      // AIRPORT-BASED SCHEDULE FALLBACK: Search for flights matching departure/arrival airports
      if (arrivalAirport) {
        console.log(`🔄 Airport schedule fallback: Searching for flights from ${departureAirport} to ${arrivalAirport}...`);
        
        try {
          // Search for all departures from the departure airport on the target date
          const departureSchedules = await this.getFutureFlight({
            iataCode: departureAirport,
            type: 'departure',
            date: date,
            arr_iataCode: arrivalAirport
          });
          
          if (departureSchedules && departureSchedules.length > 0) {
            console.log(`📊 Found ${departureSchedules.length} flights from ${departureAirport} to ${arrivalAirport}`);
            
            // Log all available flights on this route
            departureSchedules.forEach((flight, index) => {
              console.log(`🔍 Route option ${index + 1}: ${flight.flight?.iataNumber || flight.flight?.number} (${flight.airline?.iataCode}) at ${flight.departure?.scheduledTime}`);
            });
            
            // Try to find the specific flight by matching flight number
            const exactFlightMatch = departureSchedules.find(flight => {
              const scheduleFlightNum = flight.flight?.number || 
                                     flight.flight?.iataNumber?.replace(/^[A-Z0-9]{2,3}/i, '');
              const scheduleFullFlight = flight.flight?.iataNumber?.toUpperCase();
              
              return scheduleFlightNum === flightNumOnly || 
                     scheduleFullFlight === flightNumber.toUpperCase();
            });
            
            if (exactFlightMatch) {
              console.log(`✅ Found exact flight match in airport schedules: ${exactFlightMatch.flight?.iataNumber}`);
              return exactFlightMatch;
            }
            
            // If specific flight not found but we have airline matches, return the first one
            if (airlineCode) {
              const airlineMatch = departureSchedules.find(flight => 
                flight.airline?.iataCode?.toUpperCase() === airlineCode
              );
              
              if (airlineMatch) {
                console.log(`✅ Found airline match in airport schedules: ${airlineMatch.flight?.iataNumber} (${airlineMatch.airline?.iataCode})`);
                return airlineMatch;
              }
            }
            
            console.log(`⚠️ No exact match found, but ${departureSchedules.length} flights available on this route`);
            // Return the first flight as an alternative suggestion
            console.log(`💡 Suggesting alternative flight: ${departureSchedules[0].flight?.iataNumber} (${departureSchedules[0].airline?.iataCode})`);
            return departureSchedules[0];
          }
        } catch (error) {
          console.log(`⚠️ Airport schedule fallback failed:`, error);
        }
      } else if (airlineCode) {
        // DEPARTURE AIRPORT ONLY FALLBACK: Search for all flights by airline from departure airport
        console.log(`🔄 Departure airport fallback: Searching for all ${airlineCode} flights from ${departureAirport}...`);
        
        try {
          const airlineSchedules = await this.getFutureFlight({
            iataCode: departureAirport,
            type: 'departure',
            date: date,
            airline_iata: airlineCode
          });
          
          if (airlineSchedules && airlineSchedules.length > 0) {
            console.log(`📊 Found ${airlineSchedules.length} ${airlineCode} flights from ${departureAirport}`);
            
            // Log all available flights by this airline
            airlineSchedules.forEach((flight, index) => {
              console.log(`🔍 ${airlineCode} flight ${index + 1}: ${flight.flight?.iataNumber || flight.flight?.number} to ${flight.arrival?.iataCode} at ${flight.departure?.scheduledTime}`);
            });
            
            // Try to find the specific flight by matching flight number
            const exactFlightMatch = airlineSchedules.find(flight => {
              const scheduleFlightNum = flight.flight?.number || 
                                     flight.flight?.iataNumber?.replace(/^[A-Z0-9]{2,3}/i, '');
              const scheduleFullFlight = flight.flight?.iataNumber?.toUpperCase();
              
              return scheduleFlightNum === flightNumOnly || 
                     scheduleFullFlight === flightNumber.toUpperCase();
            });
            
            if (exactFlightMatch) {
              console.log(`✅ Found exact flight match in airline schedules: ${exactFlightMatch.flight?.iataNumber}`);
              return exactFlightMatch;
            }
            
            console.log(`⚠️ Specific flight ${flightNumber} not found, but found ${airlineSchedules.length} other ${airlineCode} flights`);
            // Return the first flight as an alternative suggestion
            console.log(`💡 Suggesting alternative ${airlineCode} flight: ${airlineSchedules[0].flight?.iataNumber}`);
            return airlineSchedules[0];
          }
        } catch (error) {
          console.log(`⚠️ Departure airport fallback failed:`, error);
        }
      }
      
      // FINAL FALLBACK: Try current/historical timetable search for any airline
      if (airlineCode) {
        console.log(`🔄 Final fallback: Trying current/historical timetable search for ${airlineCode}...`);
        
        try {
          const carrierFlight = await this.getIndianCarrierFlight({
            flightNumber: flightNumber,
            date: date,
            departureAirport: departureAirport,
            arrivalAirport: arrivalAirport
          });
          
          if (indianCarrierFlight) {
            console.log(`✅ Found flight via timetable search: ${indianCarrierFlight.flight?.iataNumber}`);
            return indianCarrierFlight;
          }
        } catch (error) {
          console.log(`⚠️ Timetable search failed:`, error);
        }
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ Error searching future flight by route:`, error);
      return null;
    }
  }

  /**
   * Get specific future flight by flight number and date
   */
  async getFutureFlightByNumber(
    flightNumber: string, 
    date: Date, 
    departureAirport?: string, 
    arrivalAirport?: string
  ): Promise<any | null> {
    const dateStr = date.toISOString().split('T')[0];
    const { airlineCode, flightNum } = this.parseFlightNumber(flightNumber);
    
    console.log(`🔍 Looking for future flight ${flightNumber} on ${dateStr}`);
    
    // Try departure airport first if available
    if (departureAirport) {
      console.log(`📅 Checking future departure from ${departureAirport}`);
      const depResults = await this.getFutureFlight({
        iataCode: departureAirport,
        type: 'departure',
        date: dateStr,
        flight_num: flightNum,
        airline_iata: airlineCode
      });
      
      const match = depResults.find(f => 
        f.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
        f.flight?.number === flightNum
      );
      
      if (match) {
        console.log(`✅ Found future flight in departure data`);
        return match;
      }
    }
    
    // Try arrival airport if available
    if (arrivalAirport) {
      console.log(`📅 Checking future arrival at ${arrivalAirport}`);
      const arrResults = await this.getFutureFlight({
        iataCode: arrivalAirport,
        type: 'arrival',
        date: dateStr,
        flight_num: flightNum,
        airline_iata: airlineCode
      });
      
      const match = arrResults.find(f => 
        f.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
        f.flight?.number === flightNum
      );
      
      if (match) {
        console.log(`✅ Found future flight in arrival data`);
        return match;
      }
    }
    
    // If no specific airports, try common hub airports for the airline
    if (airlineCode) {
      const airlineInfo = await this.getAirlineInfo(airlineCode);
      const hubAirports = airlineInfo?.codeHub ? [airlineInfo.codeHub] : ['JFK', 'LHR', 'CDG', 'DXB', 'DEL'];
      
      console.log(`🔍 Searching future data in hub airports: ${hubAirports.join(', ')}`);
      
      for (const airport of hubAirports) {
        try {
          const [depResults, arrResults] = await Promise.all([
            this.getFutureFlight({
              iataCode: airport,
              type: 'departure',
              date: dateStr,
              flight_num: flightNum,
              airline_iata: airlineCode
            }),
            this.getFutureFlight({
              iataCode: airport,
              type: 'arrival',
              date: dateStr,
              flight_num: flightNum,
              airline_iata: airlineCode
            })
          ]);
          
          const allResults = [...depResults, ...arrResults];
          const match = allResults.find(f => 
            f.flight?.iataNumber?.toUpperCase() === flightNumber.toUpperCase() ||
            f.flight?.number === flightNum
          );
          
          if (match) {
            console.log(`✅ Found future flight at ${airport}`);
            return match;
          }
        } catch (error) {
          console.log(`⚠️ Error searching future data at ${airport}:`, error);
          continue;
        }
      }
    }
    
    console.log(`❌ No future flight data found for ${flightNumber} on ${dateStr}`);
    return null;
  }

  /**
   * Get airline routes
   */
  async getAirlineRoutes(params: {
    departureIata?: string;
    arrivalIata?: string;
    airlineIata?: string;
    flightNumber?: string;
  }): Promise<AviationEdgeRoute[]> {
    const data = await this.makeRequest('/routes', params);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get live flights with filters
   */
  async getLiveFlights(params: {
    depIata?: string;
    arrIata?: string;
    airlineIata?: string;
    flightIata?: string;
    status?: string;
    limit?: string;
  }): Promise<AviationEdgeFlight[]> {
    const data = await this.makeRequest('/flights', params);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get date-specific timetable for flights within 1-7 days
   * This method searches both departure and arrival airports for the specific date
   */
  async getDateSpecificTimetable(
    flightNumber: string,
    departureAirport: string,
    arrivalAirport: string,
    date: Date
  ): Promise<any> {
    try {
      const { airlineCode, flightNum } = this.parseFlightNumber(flightNumber);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log(`📅 Getting date-specific timetable for ${flightNumber} on ${dateStr} (${departureAirport} → ${arrivalAirport})`);
      
      // Search departure airport first - try multiple strategies for date-specific search
      
      // Strategy 1: Search by scheduled departure date (full day range)
      const depParams1 = {
        iataCode: departureAirport,
        type: 'departure',
        flight_iata: flightNumber,
        status: 'scheduled' // Only get scheduled flights
      };
      
      // Strategy 2: Search by flight number and airline (broader search)
      const depParams2 = {
        iataCode: departureAirport,
        type: 'departure',
        airline_iata: airlineCode,
        flight_num: flightNum.toString()
      };
      
      console.log('📡 Date-specific departure strategy 1 (scheduled flights):', depParams1);
      
      // Try Strategy 1: Scheduled flights only
      let departureSchedule = await this.makeRequest('/timetable', depParams1);
      
      if (departureSchedule && Array.isArray(departureSchedule)) {
        // Filter for the specific date
        departureSchedule = this.filterFlightsByDate(departureSchedule, date, 'departure');
        console.log(`🔍 Strategy 1: Found ${departureSchedule.length} scheduled departure flights for ${dateStr}`);
      }
      
      // If Strategy 1 failed, try Strategy 2: Broader search by airline and flight number
      if (!departureSchedule || departureSchedule.length === 0) {
        console.log('📡 Date-specific departure strategy 2 (airline + flight number):', depParams2);
        const broadResults = await this.makeRequest('/timetable', depParams2);
        
        if (broadResults && Array.isArray(broadResults)) {
          // Filter for the specific date and future flights only
          departureSchedule = this.filterFlightsByDate(broadResults, date, 'departure');
          console.log(`🔍 Strategy 2: Filtered ${broadResults.length} departure flights to ${departureSchedule.length} for target date ${dateStr}`);
        } else {
          departureSchedule = [];
        }
      }
      
      // Search arrival airport - try multiple strategies for date-specific search
      
      // Strategy 1: Search by scheduled arrival flights only
      const arrParams1 = {
        iataCode: arrivalAirport,
        type: 'arrival',
        flight_iata: flightNumber,
        status: 'scheduled' // Only get scheduled flights
      };
      
      // Strategy 2: Search by flight number and airline (broader search)
      const arrParams2 = {
        iataCode: arrivalAirport,
        type: 'arrival',
        airline_iata: airlineCode,
        flight_num: flightNum.toString()
      };
      
      console.log('📡 Date-specific arrival strategy 1 (scheduled flights):', arrParams1);
      
      // Try Strategy 1: Scheduled flights only
      let arrivalSchedule = await this.makeRequest('/timetable', arrParams1);
      
      if (arrivalSchedule && Array.isArray(arrivalSchedule)) {
        // Filter for the specific date
        arrivalSchedule = this.filterFlightsByDate(arrivalSchedule, date, 'arrival');
        console.log(`🔍 Strategy 1: Found ${arrivalSchedule.length} scheduled arrival flights for ${dateStr}`);
      }
      
      // If Strategy 1 failed, try Strategy 2: Broader search by airline and flight number
      if (!arrivalSchedule || arrivalSchedule.length === 0) {
        console.log('📡 Date-specific arrival strategy 2 (airline + flight number):', arrParams2);
        const broadResults = await this.makeRequest('/timetable', arrParams2);
        
        if (broadResults && Array.isArray(broadResults)) {
          // Filter for the specific date and future flights only
          arrivalSchedule = this.filterFlightsByDate(broadResults, date, 'arrival');
          console.log(`🔍 Strategy 2: Filtered ${broadResults.length} arrival flights to ${arrivalSchedule.length} for target date ${dateStr}`);
        } else {
          arrivalSchedule = [];
        }
      }
      
      // Process and combine results
      const departureData = Array.isArray(departureSchedule) && departureSchedule.length > 0 ? departureSchedule[0] : null;
      const arrivalData = Array.isArray(arrivalSchedule) && arrivalSchedule.length > 0 ? arrivalSchedule[0] : null;
      
      if (departureData || arrivalData) {
        // Additional validation (our filtering should have already handled this, but double-check)
        const scheduledTime = departureData?.departure?.scheduledTime || arrivalData?.arrival?.scheduledTime;
        const now = new Date();
        const targetDate = new Date(date);
        
        if (scheduledTime) {
          const scheduleDate = new Date(scheduledTime);
          const flightDateStr = scheduleDate.toISOString().split('T')[0];
          const targetDateStr = targetDate.toISOString().split('T')[0];
          
          // Ensure it's for the correct date and is future
          if (flightDateStr !== targetDateStr) {
            console.log(`⚠️ Date validation failed: flight=${flightDateStr}, target=${targetDateStr}`);
            return null;
          }
          
          if (scheduleDate <= now) {
            console.log(`⚠️ Future validation failed: scheduled=${scheduleDate.toISOString()}, now=${now.toISOString()}`);
            return null;
          }
        }
        
        // Combine departure and arrival data, prioritizing departure data for core flight info
        const combinedData = {
          ...departureData,
          arrival: arrivalData?.arrival || departureData?.arrival,
          departure: departureData?.departure || arrivalData?.departure,
          // Use the more complete dataset for airline and flight info
          airline: departureData?.airline || arrivalData?.airline,
          flight: departureData?.flight || arrivalData?.flight,
          status: 'scheduled', // Force scheduled status for date-specific searches
          type: 'combined' // Mark as combined data
        };
        
        console.log(`✅ Found date-specific timetable data:`, {
          flightNumber,
          date: dateStr,
          hasDepartureData: !!departureData,
          hasArrivalData: !!arrivalData,
          status: combinedData.status,
          depGate: combinedData.departure?.gate,
          arrGate: combinedData.arrival?.gate,
          depTerminal: combinedData.departure?.terminal,
          arrTerminal: combinedData.arrival?.terminal,
          baggage: combinedData.arrival?.baggage
        });
        
        return combinedData;
      }
      
      console.log(`⚠️ No date-specific timetable found for ${flightNumber} on ${dateStr}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error getting date-specific timetable for ${flightNumber}:`, error);
      return null;
    }
  }

  /**
   * Filter flights by specific date and ensure they are future flights
   */
  private filterFlightsByDate(flights: any[], targetDate: Date, type: 'departure' | 'arrival'): any[] {
    const now = new Date();
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    return flights.filter(flight => {
      const scheduledTime = type === 'departure' 
        ? flight.departure?.scheduledTime 
        : flight.arrival?.scheduledTime;
        
      if (!scheduledTime) return false;
      
      const flightDate = new Date(scheduledTime);
      const flightDateStr = flightDate.toISOString().split('T')[0];
      
      // Must be for the target date and in the future
      return flightDateStr === targetDateStr && flightDate > now;
    });
  }

  /**
   * Get future flight schedule with aircraft information for today's flights
   */
  async getFutureFlightSchedule(
    flightNumber: string, 
    departureAirport: string, 
    date: Date
  ): Promise<any> {
    try {
      const { airlineCode, flightNum } = this.parseFlightNumber(flightNumber);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log(`🔮 Getting future flight schedule for ${flightNumber} from ${departureAirport} on ${dateStr}`);
      
      const params = {
        iataCode: departureAirport,
        type: 'departure',
        date: dateStr,
        flight_num: flightNum,
        airline_iata: airlineCode
      };
      
      console.log('📡 Future flight schedule params:', params);
      
      const response = await this.makeRequest('/flightsFuture', params);
      
      if (response && Array.isArray(response) && response.length > 0) {
        console.log(`✅ Found future flight schedule with aircraft info:`, {
          flight: response[0].flight?.iataNumber,
          aircraft: response[0].aircraft,
          departure: response[0].departure,
          arrival: response[0].arrival
        });
        return response[0];
      }
      
      console.log('⚠️ No future flight schedule found');
      return null;
    } catch (error) {
      console.error('❌ Error getting future flight schedule:', error);
      return null;
    }
  }

  /**
   * Get comprehensive flight information from Aviation Edge
   */
  async getComprehensiveFlightInfo(flightNumber: string, departureAirport?: string, arrivalAirport?: string, date?: Date): Promise<{
    schedule?: AviationEdgeSchedule;
    airline?: AviationEdgeAirline;
    departureAirport?: AviationEdgeAirport;
    arrivalAirport?: AviationEdgeAirport;
    route?: AviationEdgeRoute;
    live?: AviationEdgeFlight;
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
      const routes = await this.getAirlineRoutes({
        departureIata: departureAirport,
        arrivalIata: arrivalAirport,
        airlineIata: airlineCode
      });
      if (routes.length > 0) {
        result.route = routes[0];
      }
    }

    // Get live flight data
    const liveFlights = await this.getLiveFlights({
      flightIata: flightNumber,
      limit: '1'
    });
    if (liveFlights.length > 0) {
      result.live = liveFlights[0];
    }

    // For today's flights, try to get aircraft info from Future Schedules API
    if (departureAirport && date) {
      const today = new Date();
      const flightDate = new Date(date);
      const daysDiff = Math.abs((flightDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only use Future Schedules API for flights more than 7 days in the future (API limitation)
      if (daysDiff > 7) {
        console.log(`🔮 Fetching aircraft info from Future Schedules for future flight: ${flightNumber}`);
        const futureSchedule = await this.getFutureFlightSchedule(flightNumber, departureAirport, flightDate);
        
        if (futureSchedule?.aircraft) {
          result.aircraft = futureSchedule.aircraft;
          console.log(`✈️ Found aircraft info from Future Schedules:`, {
            modelCode: futureSchedule.aircraft.modelCode,
            modelText: futureSchedule.aircraft.modelText,
            registration: futureSchedule.aircraft.registration
          });
        }
      } else {
        console.log(`⚠️ Future Schedules API only works for dates > 7 days ahead. Current flight is ${daysDiff.toFixed(1)} days ahead.`);
      }
    }

    return result;
  }

  /**
   * Check if a flight is scheduled for a future date
   */
  async checkFutureFlight(flightNumber: string, date: Date, airport: string): Promise<any> {
    const dateStr = date.toISOString().split('T')[0];
    const flightNum = flightNumber.replace(/[A-Z]+/, '');
    const airlineCode = flightNumber.match(/^([A-Z0-9]{2,3})/)?.[1];

    const futureFlights = await this.getFutureFlight({
      iataCode: airport,
      type: 'departure',
      date: dateStr,
      airline_iata: airlineCode || '',
      flight_num: flightNum
    });

    return futureFlights.find(f => 
      f.flight?.iataNumber === flightNumber || 
      f.flight?.number === flightNum
    );
  }

  /**
   * Filter out codeshare flights from the list of schedules
   * Based on Aviation Edge documentation: https://aviation-edge.com/codeshares-object-description/
   */
  private filterOutCodeshares(schedules: AviationEdgeSchedule[]): AviationEdgeSchedule[] {
    console.log(`🔍 Filtering codeshare flights from ${schedules.length} schedules`);
    
    const operatingFlights = schedules.filter(schedule => !this.isCodeshareFlight(schedule));
    const codeshareFlights = schedules.filter(schedule => this.isCodeshareFlight(schedule));
    
    console.log(`📊 Found ${operatingFlights.length} operating flights and ${codeshareFlights.length} codeshare flights`);
    
    // Log codeshare details for debugging
    if (codeshareFlights.length > 0) {
      console.log('🔗 Codeshare flights found:');
      codeshareFlights.forEach(flight => {
        console.log(`   - ${flight.flight?.iataNumber} (${flight.airline?.name}) → operated by ${flight.codeshared?.flight?.iataNumber} (${flight.codeshared?.airline?.name})`);
      });
    }
    
    return operatingFlights;
  }

  /**
   * Check if a flight is a codeshare flight based on Aviation Edge documentation
   * According to https://aviation-edge.com/codeshares-object-description/:
   * - Actual operating flights have codeshared: null
   * - Codeshare flights have a non-null "codeshared" field with operating flight details
   */
  private isCodeshareFlight(schedule: AviationEdgeSchedule): boolean {
    const isCodeshare = schedule.codeshared !== null && schedule.codeshared !== undefined;
    
          if (isCodeshare && schedule.codeshared) {
      console.log(`🔗 Codeshare detected: ${schedule.flight?.iataNumber} (marketed by ${schedule.airline?.name}) → operated by ${schedule.codeshared.flight?.iataNumber} (${schedule.codeshared.airline?.name})`);
    }
    
    return isCodeshare;
  }

  /**
   * Get both operating and codeshare flights (useful for comprehensive flight tracking)
   */
  private categorizeFlights(schedules: AviationEdgeSchedule[]): {
    operating: AviationEdgeSchedule[];
    codeshare: AviationEdgeSchedule[];
  } {
    const operating = schedules.filter(schedule => !this.isCodeshareFlight(schedule));
    const codeshare = schedules.filter(schedule => this.isCodeshareFlight(schedule));
    
    return { operating, codeshare };
  }

  /**
   * Test Aviation Edge Timetable API connectivity and data quality
   */
  async testTimetableAPI(testAirport: string = 'JFK'): Promise<{
    success: boolean;
    endpoint: string;
    responseTime: number;
    dataQuality: {
      totalFlights: number;
      hasScheduledTimes: number;
      hasEstimatedTimes: number;
      hasActualTimes: number;
      hasGateInfo: number;
      hasTerminalInfo: number;
      hasDelayInfo: number;
      statusTypes: string[];
    };
    sampleFlight?: any;
    error?: string;
  }> {
    const startTime = Date.now();
    const endpoint = `${API_CONFIG.AVIATION_EDGE.BASE_URL}${API_CONFIG.AVIATION_EDGE.ENDPOINTS.TIMETABLE}`;
    
    try {
      console.log(`🧪 Testing Aviation Edge Timetable API with airport: ${testAirport}`);
      
      const schedules = await this.getAirportTimetable({
        iataCode: testAirport,
        type: 'departure'
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!Array.isArray(schedules) || schedules.length === 0) {
        return {
          success: false,
          endpoint,
          responseTime,
          dataQuality: {
            totalFlights: 0,
            hasScheduledTimes: 0,
            hasEstimatedTimes: 0,
            hasActualTimes: 0,
            hasGateInfo: 0,
            hasTerminalInfo: 0,
            hasDelayInfo: 0,
            statusTypes: []
          },
          error: 'No data returned from API'
        };
      }
      
      // Analyze data quality
      const dataQuality = {
        totalFlights: schedules.length,
        hasScheduledTimes: schedules.filter(s => s.departure?.scheduledTime || s.arrival?.scheduledTime).length,
        hasEstimatedTimes: schedules.filter(s => s.departure?.estimatedTime || s.arrival?.estimatedTime).length,
        hasActualTimes: schedules.filter(s => s.departure?.actualTime || s.arrival?.actualTime).length,
        hasGateInfo: schedules.filter(s => s.departure?.gate || s.arrival?.gate).length,
        hasTerminalInfo: schedules.filter(s => s.departure?.terminal || s.arrival?.terminal).length,
        hasDelayInfo: schedules.filter(s => s.departure?.delay || s.arrival?.delay).length,
        statusTypes: [...new Set(schedules.map(s => s.status).filter(Boolean))]
      };
      
      console.log(`✅ Aviation Edge Timetable API test successful:`, {
        responseTime: `${responseTime}ms`,
        dataQuality
      });
      
      return {
        success: true,
        endpoint,
        responseTime,
        dataQuality,
        sampleFlight: schedules[0]
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Aviation Edge Timetable API test failed:`, error);
      
      return {
        success: false,
        endpoint,
        responseTime,
        dataQuality: {
          totalFlights: 0,
          hasScheduledTimes: 0,
          hasEstimatedTimes: 0,
          hasActualTimes: 0,
          hasGateInfo: 0,
          hasTerminalInfo: 0,
          hasDelayInfo: 0,
          statusTypes: []
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get airport timetable with enhanced parameters (based on Aviation Edge API documentation)
   * This method supports all the documented query parameters for optimal flight lookup
   */
  async getEnhancedAirportTimetable(params: {
    iataCode: string;
    type: 'arrival' | 'departure';
    status?: string;
    airline_iata?: string;
    airline_icao?: string;
    airline_name?: string;
    flight_num?: string;
    flight_iata?: string;
    flight_icao?: string;
    dep_terminal?: string;
    arr_terminal?: string;
    dep_delay?: string;
    arr_delay?: string;
    dep_schTime?: string;
    dep_estTime?: string;
    dep_actTime?: string;
    dep_estRunway?: string;
    dep_actRunway?: string;
    arr_schTime?: string;
    arr_estTime?: string;
    arr_actTime?: string;
    arr_estRunway?: string;
    arr_actRunway?: string;
  }): Promise<AviationEdgeSchedule[]> {
    console.log(`📅 Getting enhanced airport timetable with params:`, {
      iataCode: params.iataCode,
      type: params.type,
      airline: params.airline_iata || params.airline_icao || params.airline_name,
      flight: params.flight_num || params.flight_iata || params.flight_icao
    });

    // Clean up parameters (remove undefined values)
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    console.log(`🔍 Enhanced timetable query params:`, cleanParams);

    const data = await this.makeRequest(API_CONFIG.AVIATION_EDGE.ENDPOINTS.TIMETABLE, cleanParams);
    
    console.log(`🔍 Raw API response:`, data);
    
    if (Array.isArray(data)) {
      console.log(`✅ Found ${data.length} enhanced timetable entries for ${params.iataCode} (${params.type})`);
      
      // Filter out codeshare flights
      const filteredSchedules = this.filterOutCodeshares(data);
      console.log(`📊 After codeshare filtering: ${data.length} → ${filteredSchedules.length}`);
      
      return filteredSchedules;
    } else if (data && typeof data === 'object') {
      if (data.error) {
        console.log(`❌ API Error: ${data.error}`);
        if (data.error === 'No Record Found') {
          console.log(`🔍 This usually means either:`);
          console.log(`   - The airport code is invalid`);
          console.log(`   - The API key is invalid/expired`);
          console.log(`   - The endpoint is incorrect`);
          console.log(`   - No flights exist for this airport/type combination`);
        }
      }
      console.log(`⚠️ Unexpected response format:`, data);
      return [];
    } else {
      console.log(`❌ No enhanced timetable data found for ${params.iataCode} (${params.type})`);
      return [];
    }
  }

  /**
   * Smart flight lookup using enhanced timetable with multiple strategies
   * Based on Aviation Edge API documentation for optimal flight finding
   */
  async findFlightSmart(flightNumber: string, airportCode: string, type: 'arrival' | 'departure'): Promise<AviationEdgeSchedule | null> {
    console.log(`🔍 Smart flight lookup for ${flightNumber} at ${airportCode} (${type})`);

    // Strategy 1: Try with full flight IATA code first (most specific)
    console.log(`🔍 Strategy 1: Looking for full flight IATA code ${flightNumber}`);
    let schedules = await this.getEnhancedAirportTimetable({
      iataCode: airportCode,
      type: type,
      flight_iata: flightNumber
    });

    // Strategy 2: If no results, try with flight number only
    if (schedules.length === 0) {
      const flightNum = flightNumber.replace(/^[A-Z0-9]{2,3}/i, '');
      console.log(`🔍 Strategy 2: Looking for flight number ${flightNum}`);
      schedules = await this.getEnhancedAirportTimetable({
        iataCode: airportCode,
        type: type,
        flight_num: flightNum
      });
    }

    // Strategy 3: Try with airline code + flight number
    if (schedules.length === 0) {
      const airlineCode = flightNumber.match(/^([A-Z0-9]{2,3})/i)?.[1];
      if (airlineCode) {
        const flightNum = flightNumber.replace(/^[A-Z0-9]{2,3}/i, '');
        console.log(`🔍 Strategy 3: Looking for airline ${airlineCode} + flight number ${flightNum}`);
        schedules = await this.getEnhancedAirportTimetable({
          iataCode: airportCode,
          type: type,
          airline_iata: airlineCode,
          flight_num: flightNum
        });
      }
    }

    // Strategy 4: Try with airline name (if we can determine it)
    if (schedules.length === 0) {
      const airlineCode = flightNumber.match(/^([A-Z0-9]{2,3})/i)?.[1];
      if (airlineCode) {
        console.log(`🔍 Strategy 4: Looking for airline ${airlineCode} only`);
        schedules = await this.getEnhancedAirportTimetable({
          iataCode: airportCode,
          type: type,
          airline_iata: airlineCode
        });
      }
    }

    // Strategy 5: Try with ICAO codes if available
    if (schedules.length === 0) {
      const airlineCode = flightNumber.match(/^([A-Z0-9]{2,3})/i)?.[1];
      if (airlineCode) {
        // Try to get ICAO code for the airline
        const airlineInfo = await this.getAirlineInfo(airlineCode);
        if (airlineInfo?.codeIcaoAirline) {
          console.log(`🔍 Strategy 5: Looking for airline ICAO ${airlineInfo.codeIcaoAirline}`);
          schedules = await this.getEnhancedAirportTimetable({
            iataCode: airportCode,
            type: type,
            airline_icao: airlineInfo.codeIcaoAirline
          });
        }
      }
    }

    console.log(`📊 Found ${schedules.length} schedule entries after all strategies`);

    if (schedules.length > 0) {
      // Find the best matching flight
      const matchingSchedule = this.findBestMatchingSchedule(schedules, flightNumber);
      
      if (matchingSchedule) {
        console.log('✅ Found matching schedule:', {
          flightNumber: matchingSchedule.flight?.iataNumber,
          flightNum: matchingSchedule.flight?.number,
          airline: matchingSchedule.airline?.name,
          departure: matchingSchedule.departure?.iataCode,
          arrival: matchingSchedule.arrival?.iataCode
        });
        return matchingSchedule;
      }
    }

    console.log('❌ No matching schedule found after all strategies');
    return null;
  }

  /**
   * Find the best matching schedule from a list of schedules
   */
  private findBestMatchingSchedule(schedules: AviationEdgeSchedule[], targetFlightNumber: string): AviationEdgeSchedule | null {
    // Priority 1: Exact IATA flight number match
    const exactIataMatch = schedules.find(s => 
      s.flight?.iataNumber?.toUpperCase() === targetFlightNumber.toUpperCase()
    );
    if (exactIataMatch) return exactIataMatch;

    // Priority 2: Exact ICAO flight number match
    const exactIcaoMatch = schedules.find(s => 
      s.flight?.icaoNumber?.toUpperCase() === targetFlightNumber.toUpperCase()
    );
    if (exactIcaoMatch) return exactIcaoMatch;

    // Priority 3: Flight number match (without airline code)
    const flightNum = targetFlightNumber.replace(/^[A-Z]{2,3}/i, '');
    const flightNumMatch = schedules.find(s => 
      s.flight?.number === flightNum
    );
    if (flightNumMatch) return flightNumMatch;

    // Priority 4: Partial IATA match (e.g., "6E6829" matches "6E829")
    const partialIataMatch = schedules.find(s => 
      s.flight?.iataNumber?.includes(flightNum) || 
      flightNum.includes(s.flight?.iataNumber || '')
    );
    if (partialIataMatch) return partialIataMatch;

    // Priority 5: First available schedule
    return schedules[0];
  }

  /**
   * Test API connection with CORS proxy fallback
   */
  async testAPIConnection(): Promise<boolean> {
    console.log('🧪 Testing Aviation Edge API connection...');
    
    try {
      // Test with a simple airline lookup
      const testUrl = `${API_CONFIG.AVIATION_EDGE.ENDPOINTS.AIRLINE_DATABASE}?key=${API_CONFIG.AVIATION_EDGE.API_KEY}&codeIataAirline=AA`;
      
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

  /**
   * Test timetable endpoint with proper parameters
   */
  async testTimetableEndpoint(airportCode: string = 'JFK', type: 'arrival' | 'departure' = 'departure'): Promise<boolean> {
    console.log(`🧪 Testing timetable endpoint for ${airportCode} (${type})...`);
    
    try {
      const testParams = {
        iataCode: airportCode,
        type: type,
        limit: 5 // Limit results for testing
      };
      
      const data = await this.makeRequest(API_CONFIG.AVIATION_EDGE.ENDPOINTS.TIMETABLE, testParams);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Timetable endpoint working: Found ${data.length} flights`);
        console.log('📋 Sample flight:', {
          flight: data[0].flight?.iataNumber,
          airline: data[0].airline?.name,
          departure: data[0].departure?.iataCode,
          arrival: data[0].arrival?.iataCode
        });
        return true;
      } else if (data && typeof data === 'object' && data.error) {
        console.log(`⚠️ Timetable endpoint returned error: ${data.error}`);
        return false;
      } else {
        console.log(`⚠️ Timetable endpoint returned unexpected format:`, data);
        return false;
      }
    } catch (error) {
      console.error('❌ Timetable endpoint test error:', error);
      return false;
    }
  }

  /**
   * Get future airport timetable for a specific date range
   * Uses the Future Schedules API endpoint
   */
  async getFutureAirportTimetable(
    airportIata: string,
    type: 'departure' | 'arrival',
    targetDate: Date,
    daysRange: number = 7
  ): Promise<AviationEdgeSchedule[]> {
    try {
      console.log(`🔮 Getting future ${type} timetable for ${airportIata} around ${targetDate.toISOString()}`);
      
      const dateStr = targetDate.toISOString().split('T')[0];
      
      // Use the Future Schedules API endpoint
      const params = {
        iataCode: airportIata,
        type: type,
        date: dateStr
      };
      
      console.log(`📡 Using Future Schedules API:`, params);
      
      const response = await this.getFutureFlight(params);
      
      if (response && Array.isArray(response)) {
        console.log(`✅ Found ${response.length} future ${type} schedules for ${airportIata}`);
        
        // Filter out codeshare flights to show only operating flights
        const operatingFlights = this.filterOutCodeshares(response);
        console.log(`📊 After codeshare filtering: ${response.length} → ${operatingFlights.length} future flights`);
        
        return operatingFlights;
      }
      
      console.log(`⚠️ No future ${type} schedules found for ${airportIata}`);
      return [];
    } catch (error) {
      console.error(`❌ Error getting future ${type} timetable for ${airportIata}:`, error);
      return [];
    }
  }

  /**
   * Get historical airport timetable for a specific date range
   * Uses the Historical Schedules API endpoint
   */
  async getHistoricalAirportTimetable(
    airportIata: string,
    type: 'departure' | 'arrival',
    targetDate: Date,
    daysRange: number = 7
  ): Promise<AviationEdgeSchedule[]> {
    try {
      console.log(`📅 Getting historical ${type} timetable for ${airportIata} around ${targetDate.toISOString()}`);
      
      const dateStr = targetDate.toISOString().split('T')[0];
      
      // Use the Historical Schedules API endpoint
      const params = {
        code: airportIata,
        type: type,
        date_from: dateStr,
        date_to: dateStr
      };
      
      console.log(`📡 Using Historical Schedules API:`, params);
      
      const response = await this.getHistoricalFlight(params);
      
      if (response && Array.isArray(response)) {
        console.log(`✅ Found ${response.length} historical ${type} schedules for ${airportIata}`);
        
        // Filter out codeshare flights to show only operating flights
        const operatingFlights = this.filterOutCodeshares(response);
        console.log(`📊 After codeshare filtering: ${response.length} → ${operatingFlights.length} historical flights`);
        
        return operatingFlights;
      }
      
      console.log(`⚠️ No historical ${type} schedules found for ${airportIata}`);
      return [];
    } catch (error) {
      console.error(`❌ Error getting historical ${type} timetable for ${airportIata}:`, error);
      return [];
    }
  }

  /**
   * Get current airport timetable for the next hours
   * Uses the standard timetable endpoint without date parameters as per Aviation Edge documentation
   */
  async getCurrentAirportTimetable(
    airportIata: string,
    type: 'departure' | 'arrival',
    hoursAhead: number = 24
  ): Promise<AviationEdgeSchedule[]> {
    try {
      console.log(`🕐 Getting current ${type} timetable for ${airportIata} for next ${hoursAhead} hours`);
      
      // Use the standard timetable endpoint WITHOUT date parameters for current schedules
      // This is the correct way according to Aviation Edge API documentation
      const params = {
        iataCode: airportIata,
        type: type
        // No date parameters for current timetable as per API docs
      };
      
      console.log(`📡 Using current timetable API (no date params):`, params);
      
      const response = await this.getAirportTimetable(params);
      
      if (response && Array.isArray(response)) {
        console.log(`✅ Found ${response.length} current ${type} schedules for ${airportIata}`);
        
        // Filter by time range on the client side
        const now = new Date();
        const endTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
        
        const filteredSchedules = response.filter(schedule => {
          let scheduledTime: string | undefined;
          
          if (type === 'departure') {
            scheduledTime = schedule.departure?.scheduledTime || schedule.departure?.estimatedTime;
          } else {
            scheduledTime = schedule.arrival?.scheduledTime || schedule.arrival?.estimatedTime;
          }
          
          if (!scheduledTime) return false;
          
          const scheduleTime = new Date(scheduledTime);
          return scheduleTime >= now && scheduleTime <= endTime;
        });
        
        console.log(`📊 After time filtering: ${response.length} → ${filteredSchedules.length} flights`);
        
        // Filter out codeshare flights to show only operating flights
        const operatingFlights = this.filterOutCodeshares(filteredSchedules);
        console.log(`📊 After codeshare filtering: ${filteredSchedules.length} → ${operatingFlights.length} flights`);
        
        // Debug: Log gate information from raw API response
        if (operatingFlights.length > 0) {
          console.log(`🚪 Sample gate data from Aviation Edge API:`, {
            firstFlight: operatingFlights[0].flight?.iataNumber,
            departureGate: operatingFlights[0].departure?.gate,
            departureTerminal: operatingFlights[0].departure?.terminal,
            arrivalGate: operatingFlights[0].arrival?.gate,
            arrivalTerminal: operatingFlights[0].arrival?.terminal,
            arrivalBaggage: operatingFlights[0].arrival?.baggage
          });
        }
        
        return operatingFlights;
      }
      
      console.log(`⚠️ No current ${type} schedules found for ${airportIata}`);
      return [];
    } catch (error) {
      console.error(`❌ Error getting current ${type} timetable for ${airportIata}:`, error);
      return [];
    }
  }

  /**
   * Get future flight by number with optional airport constraints
   */
  async getFutureFlightByNumber(
    flightNumber: string,
    targetDate: Date,
    departureAirport?: string,
    arrivalAirport?: string
  ): Promise<AviationEdgeSchedule | null> {
    try {
      console.log(`🔮 Getting future flight ${flightNumber} for ${targetDate.toISOString()}`);
      
      // Try to find the flight in major airports if no specific airports provided
      const searchAirports = departureAirport && arrivalAirport ? 
        [{ dep: departureAirport, arr: arrivalAirport }] :
        ['DEL', 'BOM', 'BLR', 'HYD', 'CCU', 'JFK', 'LHR', 'CDG', 'DXB'].map(airport => ({ dep: airport, arr: airport }));
      
      for (const { dep, arr } of searchAirports) {
        try {
          const params = {
            iataCode: dep,
            type: 'departure' as const,
            flight_iata: flightNumber,
            date: targetDate.toISOString().split('T')[0]
          };
          
          const response = await this.getAirportTimetable(params);
          
          if (response && Array.isArray(response) && response.length > 0) {
            console.log(`✅ Found future flight ${flightNumber} at ${dep} airport`);
            return response[0];
          }
        } catch (error) {
          console.log(`⚠️ Error searching at ${dep}:`, error);
          continue;
        }
      }
      
      console.log(`⚠️ No future flight found for ${flightNumber}`);
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
  ): Promise<AviationEdgeSchedule | null> {
    try {
      console.log(`📅 Getting historical flight ${flightNumber} for ${targetDate.toISOString()}`);
      
      // Try to find the flight in major airports if no specific airports provided
      const searchAirports = departureAirport && arrivalAirport ? 
        [{ dep: departureAirport, arr: arrivalAirport }] :
        ['DEL', 'BOM', 'BLR', 'HYD', 'CCU', 'JFK', 'LHR', 'CDG', 'DXB'].map(airport => ({ dep: airport, arr: airport }));
      
      for (const { dep, arr } of searchAirports) {
        try {
          const params = {
            iataCode: dep,
            type: 'departure' as const,
            flight_iata: flightNumber,
            date: targetDate.toISOString().split('T')[0]
          };
          
          const response = await this.getAirportTimetable(params);
          
          if (response && Array.isArray(response) && response.length > 0) {
            console.log(`✅ Found historical flight ${flightNumber} at ${dep} airport`);
            return response[0];
          }
        } catch (error) {
          console.log(`⚠️ Error searching at ${dep}:`, error);
          continue;
        }
      }
      
      console.log(`⚠️ No historical flight found for ${flightNumber}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting historical flight ${flightNumber}:`, error);
      return null;
    }
  }

  /**
   * Special method for Indian carrier flights that might not be in Aviation Edge Future API
   */
  async getIndianCarrierFlight(params: {
    flightNumber: string;
    date: string;
    departureAirport: string;
    arrivalAirport?: string;
  }): Promise<AviationEdgeSchedule | null> {
    const { flightNumber, date, departureAirport, arrivalAirport } = params;
    
    console.log(`🇮🇳 Searching for Indian carrier flight: ${flightNumber} on ${date} from ${departureAirport}`);
    
    // Extract airline code and flight number using helper function
    const { airlineCode, flightNum: flightNumOnly } = this.parseFlightNumber(flightNumber);
    
    console.log(`🔍 Parsed: Airline: ${airlineCode}, Flight Number: ${flightNumOnly}`);
    
    try {
      // Method 1: Try current schedules (most reliable for Indian carriers)
      console.log(`🔍 Method 1: Searching current schedules for ${departureAirport} departures...`);
      const currentSchedules = await this.getCurrentAirportTimetable(departureAirport, 'departure', 72);
      console.log(`📊 Found ${currentSchedules.length} current schedules`);
      
      // Log some sample flights for debugging
      if (currentSchedules.length > 0) {
        console.log(`🔍 Sample current flights:`, currentSchedules.slice(0, 3).map(s => ({
          flight: s.flight?.iataNumber || s.flight?.number,
          flightNumber: s.flight?.number,
          airline: s.airline?.iataCode || s.airline?.name,
          departure: s.departure?.iataCode,
          arrival: s.arrival?.iataCode
        })));
        
        // Log the first few flights in detail
        currentSchedules.slice(0, 5).forEach((schedule, index) => {
          console.log(`🔍 Flight ${index + 1} details:`, {
            flight: {
              iataNumber: schedule.flight?.iataNumber,
              number: schedule.flight?.number,
              icaoNumber: schedule.flight?.icaoNumber
            },
            airline: {
              iataCode: schedule.airline?.iataCode,
              name: schedule.airline?.name,
              icaoCode: schedule.airline?.icaoCode
            },
            departure: {
              iataCode: schedule.departure?.iataCode,
              scheduledTime: schedule.departure?.scheduledTime
            },
            arrival: {
              iataCode: schedule.arrival?.iataCode,
              scheduledTime: schedule.arrival?.scheduledTime
            }
          });
        });
      }
      
      const matchingFlight = currentSchedules.find(schedule => {
        const scheduleFlightNum = schedule.flight?.number || 
                                schedule.flight?.iataNumber?.replace(/^[A-Z0-9]{2,3}/i, '');
        const scheduleAirlineCode = schedule.airline?.iataCode?.toUpperCase();
        
        const matchesFlight = scheduleFlightNum === flightNumOnly;
        const matchesAirline = scheduleAirlineCode === airlineCode;
        const matchesRoute = !arrivalAirport || 
                           schedule.arrival?.iataCode?.toUpperCase() === arrivalAirport.toUpperCase();
        
        console.log(`🔍 Checking flight: ${schedule.flight?.iataNumber || schedule.flight?.number} (${scheduleAirlineCode}) - Flight match: ${matchesFlight}, Airline match: ${matchesAirline}, Route match: ${matchesRoute}`);
        console.log(`🔍 Comparing: scheduleFlightNum=${scheduleFlightNum} vs flightNumOnly=${flightNumOnly}`);
        console.log(`🔍 Comparing: scheduleAirlineCode=${scheduleAirlineCode} vs airlineCode=${airlineCode}`);
        
        // Prioritize exact matches (both flight number and airline)
        if (matchesFlight && matchesAirline) {
          console.log(`✅ Found exact match: ${schedule.flight?.iataNumber} (${scheduleAirlineCode})`);
          return true;
        }
        
        // Fallback to flight number match only if no exact match found
        return matchesFlight && matchesRoute;
      });
      
      if (matchingFlight) {
        console.log(`✅ Found Indian carrier flight in current schedules: ${matchingFlight.flight?.iataNumber} (${matchingFlight.airline?.iataCode})`);
        return matchingFlight;
      }
      
      // Method 2: Try historical schedules for the same date last week
      console.log(`🔍 Method 2: Searching historical schedules for ${departureAirport} departures...`);
      const targetDate = new Date(date);
      const lastWeekDate = new Date(targetDate);
      lastWeekDate.setDate(targetDate.getDate() - 7);
      
      const historicalSchedules = await this.getHistoricalAirportTimetable(
        departureAirport, 
        'departure', 
        lastWeekDate
      );
      
      console.log(`📊 Found ${historicalSchedules.length} historical schedules`);
      
      const historicalMatch = historicalSchedules.find(schedule => {
        const scheduleFlightNum = schedule.flight?.number || 
                                schedule.flight?.iataNumber?.replace(/^[A-Z0-9]{2,3}/i, '');
        const scheduleAirlineCode = schedule.airline?.iataCode?.toUpperCase();
        
        const matchesFlight = scheduleFlightNum === flightNumOnly;
        const matchesAirline = scheduleAirlineCode === airlineCode;
        
        console.log(`🔍 Historical check: ${schedule.flight?.iataNumber || schedule.flight?.number} (${scheduleAirlineCode}) - Flight match: ${matchesFlight}, Airline match: ${matchesAirline}`);
        
        // Prioritize exact matches
        if (matchesFlight && matchesAirline) {
          return true;
        }
        
        return matchesFlight;
      });
      
      if (historicalMatch) {
        console.log(`✅ Found Indian carrier flight in historical schedules: ${historicalMatch.flight?.iataNumber} (${historicalMatch.airline?.iataCode})`);
        // Clone the historical flight and update the date
        const futureFlight = { ...historicalMatch };
        if (futureFlight.departure?.scheduledTime) {
          const [hours, minutes] = futureFlight.departure.scheduledTime.split(':');
          const newDate = new Date(date);
          newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          futureFlight.departure.scheduledTime = newDate.toISOString();
        }
        if (futureFlight.arrival?.scheduledTime) {
          const [hours, minutes] = futureFlight.arrival.scheduledTime.split(':');
          const newDate = new Date(date);
          newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          futureFlight.arrival.scheduledTime = newDate.toISOString();
        }
        return futureFlight;
      }
      
    } catch (error) {
      console.log(`⚠️ Indian carrier search failed:`, error);
    }
    
    console.log(`❌ Indian carrier flight not found: ${flightNumber}`);
    return null;
  }
}

export default new AviationEdgeService();
