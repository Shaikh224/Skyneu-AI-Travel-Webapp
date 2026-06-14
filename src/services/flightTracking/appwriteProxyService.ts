/**
 * Appwrite Proxy Service
 * Uses Appwrite Functions to proxy Aviationstack API calls and bypass CORS issues
 */

import { functions } from '@/lib/appwrite';
import { API_CONFIG } from '@/config/apiConfig';

class AppwriteProxyService {
  private functionId: string;

  constructor() {
    this.functionId = API_CONFIG.APPWRITE.FUNCTION_ID;
  }

  /**
   * Check if Appwrite proxy is available
   */
  isAvailable(): boolean {
    return !!(API_CONFIG.APPWRITE.PROJECT_ID && this.functionId);
  }

  /**
   * Make a request through Appwrite proxy function
   */
  async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.isAvailable()) {
      throw new Error('Appwrite proxy not available. Check PROJECT_ID and FUNCTION_ID configuration.');
    }

    try {

      // Prepare the request payload
      const payload = {
        endpoint: endpoint,
        params: params,
        apiKey: API_CONFIG.AVIATIONSTACK.API_KEY
      };

      // Execute the Appwrite function
      const execution = await functions.createExecution(
        this.functionId,
        JSON.stringify(payload)
      );

      if (!execution.response) {
        throw new Error('No response from Appwrite function');
      }

      // Parse the response
      const response = JSON.parse(execution.response);
      
      if (!response.success) {
        throw new Error(`Appwrite proxy error: ${response.error || 'Unknown error'}`);
      }

      return response.data;

    } catch (error) {
      console.error(`❌ Appwrite proxy request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get airport timetable through Appwrite proxy
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
    dep_estRunway?: string;
    dep_actRunway?: string;
    arr_schTime?: string;
    arr_estTime?: string;
    arr_actTime?: string;
    arr_estRunway?: string;
    arr_actRunway?: string;
  }): Promise<any[]> {
    // Clean up parameters (remove undefined values)
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    return await this.makeRequest('timetable', cleanParams);
  }

  /**
   * Get airline information through Appwrite proxy
   */
  async getAirlineInfo(airlineCode: string): Promise<any> {
    return await this.makeRequest('airlines', {
      iata_code: airlineCode
    });
  }

  /**
   * Get airport information through Appwrite proxy
   */
  async getAirportInfo(airportCode: string): Promise<any> {
    return await this.makeRequest('airports', {
      iata_code: airportCode
    });
  }

  /**
   * Get aircraft information through Appwrite proxy
   */
  async getAircraftInfo(registration: string): Promise<any> {
    return await this.makeRequest('airplanes', {
      registration: registration
    });
  }

  /**
   * Get city information through Appwrite proxy
   */
  async getCityInfo(cityCode: string): Promise<any> {
    return await this.makeRequest('cities', {
      iata_code: cityCode
    });
  }

  /**
   * Test the Appwrite proxy connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple airline lookup
      const result = await this.getAirlineInfo('AA');
      
      if (result && Array.isArray(result) && result.length > 0) {
        return true;
      } else {
        return false;
      }
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Get proxy status information
   */
  getStatus(): string {
    if (!this.isAvailable()) {
      return 'Not available - missing configuration';
    }
    
    return `Available - Function ID: ${this.functionId}`;
  }
}

export default new AppwriteProxyService();
