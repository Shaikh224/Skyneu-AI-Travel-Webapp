/**
 * FlightRadar24 API Service
 * Professional service for interacting with FR24 API endpoints
 */

import { API_CONFIG } from '@/config/apiConfig';

// FR24 API Response Types
export interface FR24FlightPosition {
  fr24_id: string;
  flight?: string;
  callsign?: string;
  lat?: number;
  lon?: number;
  track?: number;
  alt?: number;
  gspeed?: number;
  vspeed?: number;
  squawk?: string;
  timestamp?: string;
  source?: string;
  hex?: string;
  type?: string;
  reg?: string;
  painted_as?: string;
  operating_as?: string;
  orig_iata?: string;
  orig_icao?: string;
  dest_iata?: string;
  dest_icao?: string;
  eta?: string;
}

export interface FR24FlightSummary {
  fr24_id: string;
  flight?: string;
  callsign?: string;
  operating_as?: string;
  painted_as?: string;
  type?: string;
  reg?: string;
  orig_icao?: string;
  orig_iata?: string;
  datetime_takeoff?: string;
  runway_takeoff?: string;
  dest_icao?: string;
  dest_iata?: string;
  dest_icao_actual?: string;
  dest_iata_actual?: string;
  datetime_landed?: string;
  runway_landed?: string;
  flight_time?: number;
  actual_distance?: number;
  circle_distance?: number;
  category?: string;
  hex?: string;
  first_seen?: string;
  last_seen?: string;
  flight_ended?: boolean;
  
  // Additional timing fields that FR24 provides
  sched_dep_ts?: string;
  sched_arr_ts?: string;
  est_dep_ts?: string;
  est_arr_ts?: string;
  real_dep_ts?: string;
  real_arr_ts?: string;
  
  // Gate and terminal info (if available from FR24)
  dep_gate?: string;
  dep_terminal?: string;
  arr_gate?: string;
  arr_terminal?: string;
  baggage_belt?: string;
}

export interface FR24FlightEvent {
  type: 'gate_departure' | 'takeoff' | 'cruising' | 'airspace_transition' | 'descent' | 'landed' | 'gate_arrival';
  timestamp: string;
  lat?: number;
  lon?: number;
  alt?: number;
  gspeed?: number;
  details?: {
    gate_ident?: string;
    gate_lat?: number;
    gate_lon?: number;
    takeoff_runway?: string;
    landed_icao?: string;
    landed_runway?: string;
    exited_airspace?: string;
    entered_airspace?: string;
  };
}

export interface FR24FlightTrack {
  timestamp: string;
  lat: number;
  lon: number;
  alt: number;
  gspeed: number;
  vspeed?: number;
  track?: number;
  squawk?: string;
  callsign?: string;
  source?: string;
}

export interface FR24ApiResponse<T> {
  data?: T[];
  error?: string;
  status?: number;
}

class FR24Service {
  private apiKey: string;
  private baseUrl: string;
  private headers: Headers;

  constructor() {
    this.apiKey = API_CONFIG.FR24.API_KEY;
    this.baseUrl = API_CONFIG.FR24.BASE_URL;
    this.headers = new Headers({
      'Accept': 'application/json',
      'Accept-Version': 'v1',
      'Authorization': `Bearer ${this.apiKey}`
    });
  }

  /**
   * Get live flight positions with full details
   */
  async getLiveFlightPositions(params: {
    flights?: string[];
    callsigns?: string[];
    registrations?: string[];
    airports?: string[];
    routes?: string[];
    bounds?: { north: number; south: number; west: number; east: number };
    categories?: string[];
    limit?: number;
  }): Promise<FR24ApiResponse<FR24FlightPosition>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.flights?.length) {
        queryParams.append('flights', params.flights.join(','));
      }
      if (params.callsigns?.length) {
        queryParams.append('callsigns', params.callsigns.join(','));
      }
      if (params.registrations?.length) {
        queryParams.append('registrations', params.registrations.join(','));
      }
      if (params.airports?.length) {
        queryParams.append('airports', params.airports.join(','));
      }
      if (params.routes?.length) {
        queryParams.append('routes', params.routes.join(','));
      }
      if (params.bounds) {
        const { north, south, west, east } = params.bounds;
        queryParams.append('bounds', `${north},${south},${west},${east}`);
      }
      if (params.categories?.length) {
        queryParams.append('categories', params.categories.join(','));
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const url = `${this.baseUrl}${API_CONFIG.FR24.ENDPOINTS.LIVE_FLIGHT_POSITIONS}?${queryParams}`;
      console.log('📡 FR24 API Request:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        console.error(`❌ FR24 API Error: ${response.status} ${response.statusText}`);
        return { error: `API Error: ${response.status}`, status: response.status };
      }

      const data = await response.json();
      console.log('✅ FR24 Live Positions Response:', data);
      return data;
    } catch (error) {
      console.error('❌ FR24 Service Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get flight summary with detailed information
   */
  async getFlightSummary(params: {
    flight_ids?: string[];
    flights?: string[];
    callsigns?: string[];
    registrations?: string[];
    airports?: string[];
    routes?: string[];
    flight_datetime_from?: string;
    flight_datetime_to?: string;
    limit?: number;
  }): Promise<FR24ApiResponse<FR24FlightSummary>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.flight_ids?.length) {
        queryParams.append('flight_ids', params.flight_ids.join(','));
      } else {
        // Use date range with other filters
        if (params.flight_datetime_from) {
          queryParams.append('flight_datetime_from', params.flight_datetime_from);
        }
        if (params.flight_datetime_to) {
          queryParams.append('flight_datetime_to', params.flight_datetime_to);
        }
        
        if (params.flights?.length) {
          queryParams.append('flights', params.flights.join(','));
        }
        if (params.callsigns?.length) {
          queryParams.append('callsigns', params.callsigns.join(','));
        }
        if (params.registrations?.length) {
          queryParams.append('registrations', params.registrations.join(','));
        }
        if (params.airports?.length) {
          queryParams.append('airports', params.airports.join(','));
        }
        if (params.routes?.length) {
          queryParams.append('routes', params.routes.join(','));
        }
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const url = `${this.baseUrl}${API_CONFIG.FR24.ENDPOINTS.FLIGHT_SUMMARY}?${queryParams}`;
      console.log('📡 FR24 Flight Summary Request:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        console.error(`❌ FR24 API Error: ${response.status} ${response.statusText}`);
        return { error: `API Error: ${response.status}`, status: response.status };
      }

      const data = await response.json();
      console.log('✅ FR24 Flight Summary Response:', data);
      return data;
    } catch (error) {
      console.error('❌ FR24 Service Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get historical flight positions
   */
  async getHistoricFlightPositions(params: {
    timestamp: number;
    flights?: string[];
    callsigns?: string[];
    registrations?: string[];
    airports?: string[];
    bounds?: { north: number; south: number; west: number; east: number };
    limit?: number;
  }): Promise<FR24ApiResponse<FR24FlightPosition>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('timestamp', params.timestamp.toString());
      
      if (params.flights?.length) {
        queryParams.append('flights', params.flights.join(','));
      }
      if (params.callsigns?.length) {
        queryParams.append('callsigns', params.callsigns.join(','));
      }
      if (params.registrations?.length) {
        queryParams.append('registrations', params.registrations.join(','));
      }
      if (params.airports?.length) {
        queryParams.append('airports', params.airports.join(','));
      }
      if (params.bounds) {
        const { north, south, west, east } = params.bounds;
        queryParams.append('bounds', `${north},${south},${west},${east}`);
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const url = `${this.baseUrl}${API_CONFIG.FR24.ENDPOINTS.HISTORIC_POSITIONS}?${queryParams}`;
      console.log('📡 FR24 Historic Positions Request:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        console.error(`❌ FR24 API Error: ${response.status} ${response.statusText}`);
        return { error: `API Error: ${response.status}`, status: response.status };
      }

      const data = await response.json();
      console.log('✅ FR24 Historic Positions Response:', data);
      return data;
    } catch (error) {
      console.error('❌ FR24 Service Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get flight events (takeoff, landing, etc.)
   */
  async getFlightEvents(params: {
    flight_ids: string[];
    event_types?: string[];
  }): Promise<FR24ApiResponse<{ fr24_id: string; events: FR24FlightEvent[] }>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('flight_ids', params.flight_ids.join(','));
      
      if (params.event_types?.length) {
        queryParams.append('event_types', params.event_types.join(','));
      } else {
        queryParams.append('event_types', 'all');
      }

      const url = `${this.baseUrl}${API_CONFIG.FR24.ENDPOINTS.FLIGHT_EVENTS}?${queryParams}`;
      console.log('📡 FR24 Flight Events Request:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        console.error(`❌ FR24 API Error: ${response.status} ${response.statusText}`);
        return { error: `API Error: ${response.status}`, status: response.status };
      }

      const data = await response.json();
      console.log('✅ FR24 Flight Events Response:', data);
      return data;
    } catch (error) {
      console.error('❌ FR24 Service Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get flight tracks
   */
  async getFlightTracks(flightId: string): Promise<{ fr24_id: string; tracks: FR24FlightTrack[] } | null> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('flight_id', flightId);

      const url = `${this.baseUrl}/api/flight-tracks?${queryParams}`;
      console.log('📡 FR24 Flight Tracks Request:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        console.error(`❌ FR24 API Error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      console.log('✅ FR24 Flight Tracks Response:', data);
      return data;
    } catch (error) {
      console.error('❌ FR24 Service Error:', error);
      return null;
    }
  }

  /**
   * Search for flights by various criteria
   */
  async searchFlights(criteria: {
    flightNumber?: string;
    airline?: string;
    route?: { from: string; to: string };
    date?: Date;
    registration?: string;
  }): Promise<FR24FlightPosition[]> {
    const params: any = {};

    if (criteria.flightNumber) {
      params.flights = [criteria.flightNumber];
    }
    if (criteria.airline) {
      // Extract airline code from flight number or use directly
      params.callsigns = [criteria.airline];
    }
    if (criteria.route) {
      params.routes = [`${criteria.route.from}-${criteria.route.to}`];
    }
    if (criteria.registration) {
      params.registrations = [criteria.registration];
    }

    const response = await this.getLiveFlightPositions(params);
    return response.data || [];
  }

  /**
   * Get comprehensive flight information
   */
  async getComprehensiveFlightInfo(flightNumber: string, date?: Date): Promise<{
    live?: FR24FlightPosition;
    summary?: FR24FlightSummary;
    events?: FR24FlightEvent[];
    tracks?: FR24FlightTrack[];
  }> {
    const result: any = {};

    // Get live position
    const liveResponse = await this.getLiveFlightPositions({ flights: [flightNumber] });
    if (liveResponse.data && liveResponse.data.length > 0) {
      result.live = liveResponse.data[0];
      
      // Get tracks if we have a flight ID
      if (result.live.fr24_id) {
        const tracksData = await this.getFlightTracks(result.live.fr24_id);
        if (tracksData) {
          result.tracks = tracksData.tracks;
        }

        // Get events
        const eventsResponse = await this.getFlightEvents({ flight_ids: [result.live.fr24_id] });
        if (eventsResponse.data && eventsResponse.data.length > 0) {
          result.events = eventsResponse.data[0].events;
        }
      }
    }

    // Get flight summary - only if it's not a future date
    const now = new Date();
    const searchDate = date || now;
    
    // Only query FR24 summary for past/current dates, not future dates
    if (searchDate <= now) {
      const from = new Date(searchDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      const to = new Date(searchDate.getTime() + 12 * 60 * 60 * 1000); // 12 hours ahead
      
      // Format dates properly for FR24 API (remove milliseconds)
      const formatDate = (d: Date) => {
        return d.toISOString().split('.')[0] + 'Z';
      };

      try {
        const summaryResponse = await this.getFlightSummary({
          flights: [flightNumber],
          flight_datetime_from: formatDate(from),
          flight_datetime_to: formatDate(to),
          limit: 5
        });

        if (summaryResponse.data && summaryResponse.data.length > 0) {
          result.summary = summaryResponse.data[0];
        }
      } catch (error) {
        console.log('⚠️ FR24 summary query failed (this is normal for future flights):', error);
      }
    } else {
      console.log('📅 Skipping FR24 summary query for future date');
    }

    return result;
  }
}

export default new FR24Service();
