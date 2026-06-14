interface AviationStackAirline {
  id: string;
  airline_id: string;
  callsign: string;
  hub_code: string;
  iata_code: string;
  icao_code: string;
  country_iso2: string;
  date_founded: string;
  iata_prefix_accounting: string;
  airline_name: string;
  country_name: string;
  fleet_size: string;
  status: string;
  type: string;
  fleet_average_age: string;
}

interface AviationStackResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: AviationStackAirline[];
}

interface CachedAirline {
  name: string;
  icao: string;
  country: string;
  status: string;
  timestamp: number;
}

class AviationStackService {
  private cache: Map<string, CachedAirline> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly API_KEY = import.meta.env.VITE_AVIATIONSTACK_API_KEY;
  private readonly BASE_URL = 'https://api.aviationstack.com/v1';

  /**
   * Get airline information by IATA code
   */
  async getAirlineByIataCode(iataCode: string): Promise<CachedAirline | null> {
    if (!this.API_KEY) {
      console.warn('AviationStack API key not configured');
      return null;
    }

    const upperIataCode = iataCode.toUpperCase();
    
    // Check cache first
    const cached = this.cache.get(upperIataCode);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📱 Using cached airline data for ${upperIataCode}: ${cached.name}`);
      return cached;
    }

    try {
      console.log(`🔍 Fetching airline data for ${upperIataCode} from AviationStack API`);
      
      const response = await fetch(
        `${this.BASE_URL}/airlines?access_key=${this.API_KEY}&search=${upperIataCode}&limit=10`
      );

      if (!response.ok) {
        console.warn(`AviationStack API error: ${response.status}`);
        return null;
      }

      const data: AviationStackResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        console.log(`No airline data found for ${upperIataCode}`);
        return null;
      }

      // Find exact match by IATA code
      const airline = data.data.find(a => a.iata_code === upperIataCode);
      
      if (!airline) {
        console.log(`No exact match found for ${upperIataCode}`);
        return null;
      }

      const airlineData: CachedAirline = {
        name: airline.airline_name,
        icao: airline.icao_code,
        country: airline.country_name,
        status: airline.status,
        timestamp: Date.now()
      };

      // Cache the result
      this.cache.set(upperIataCode, airlineData);
      
      console.log(`✅ Found airline data for ${upperIataCode}: ${airlineData.name}`);
      return airlineData;

    } catch (error) {
      console.error('Error fetching airline data from AviationStack:', error);
      return null;
    }
  }

  /**
   * Get multiple airlines by IATA codes
   */
  async getAirlinesByIataCodes(iataCodes: string[]): Promise<Map<string, CachedAirline>> {
    const results = new Map<string, CachedAirline>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < iataCodes.length; i += batchSize) {
      const batch = iataCodes.slice(i, i + batchSize);
      const promises = batch.map(async (code) => {
        const airline = await this.getAirlineByIataCode(code);
        if (airline) {
          results.set(code.toUpperCase(), airline);
        }
      });
      
      await Promise.all(promises);
      
      // Add small delay between batches to be respectful to the API
      if (i + batchSize < iataCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Search airlines by name or code
   */
  async searchAirlines(query: string): Promise<CachedAirline[]> {
    if (!this.API_KEY) {
      console.warn('AviationStack API key not configured');
      return [];
    }

    try {
      console.log(`🔍 Searching airlines for: ${query}`);
      
      const response = await fetch(
        `${this.BASE_URL}/airlines?access_key=${this.API_KEY}&search=${encodeURIComponent(query)}&limit=20`
      );

      if (!response.ok) {
        console.warn(`AviationStack API error: ${response.status}`);
        return [];
      }

      const data: AviationStackResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        console.log(`No airlines found for query: ${query}`);
        return [];
      }

      const airlines: CachedAirline[] = data.data.map(airline => ({
        name: airline.airline_name,
        icao: airline.icao_code,
        country: airline.country_name,
        status: airline.status,
        timestamp: Date.now()
      }));

      // Cache the results
      airlines.forEach(airline => {
        const iataCode = data.data.find(a => a.airline_name === airline.name)?.iata_code;
        if (iataCode) {
          this.cache.set(iataCode.toUpperCase(), airline);
        }
      });

      console.log(`✅ Found ${airlines.length} airlines for query: ${query}`);
      return airlines;

    } catch (error) {
      console.error('Error searching airlines from AviationStack:', error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 AviationStack cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const aviationStackService = new AviationStackService();
export default aviationStackService;
