/**
 * Enhanced Airport Service using AviationStack API
 * Provides comprehensive airport, city, and country information
 */

interface AviationStackAirport {
  airport_name: string;
  iata_code: string;
  icao_code: string;
  latitude: string;
  longitude: string;
  geoname_id: string;
  timezone: string;
  gmt: string;
  phone_number: string | null;
  country_name: string;
  country_iso2: string;
  city_iata_code: string;
}

interface AviationStackCity {
  id: string;
  gmt: string;
  city_id: string;
  iata_code: string;
  country_iso2: string;
  geoname_id: string | null;
  latitude: string;
  longitude: string;
  city_name: string;
  timezone: string;
}

interface AviationStackCountry {
  id: string;
  capital: string;
  currency_code: string;
  fips_code: string;
  country_iso2: string;
  country_iso3: string;
  continent: string;
  country_id: string;
  country_name: string;
  currency_name: string;
  country_iso_numeric: string;
  phone_prefix: string;
  population: string;
}

interface AviationStackResponse<T> {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: T[];
}

interface CachedAirportInfo {
  name: string;
  city: string;
  country: string;
  iataCode: string;
  icaoCode: string;
  timezone: string;
  gmt: string;
  latitude: string;
  longitude: string;
  timestamp: number;
}

class AirportService {
  private airportCache: Map<string, CachedAirportInfo> = new Map();
  private cityCache: Map<string, AviationStackCity> = new Map();
  private countryCache: Map<string, AviationStackCountry> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly API_KEY = import.meta.env.VITE_AVIATIONSTACK_API_KEY;
  private readonly BASE_URL = 'https://api.aviationstack.com/v1';

  /**
   * Get comprehensive airport information by IATA code
   */
  async getAirportInfo(iataCode: string): Promise<CachedAirportInfo | null> {
    if (!this.API_KEY) {
      console.warn('AviationStack API key not configured');
      return null;
    }

    if (!iataCode) {
      return null;
    }

    const upperIataCode = iataCode.toUpperCase();
    
    // Check cache first
    const cached = this.airportCache.get(upperIataCode);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📱 Using cached airport data for ${upperIataCode}: ${cached.name}`);
      return cached;
    }

    try {
      console.log(`🔍 Fetching airport data for ${upperIataCode} from AviationStack API`);
      
      // Get airport information
      const airportResponse = await fetch(
        `${this.BASE_URL}/airports?access_key=${this.API_KEY}&iata_code=${upperIataCode}&limit=1`
      );

      if (!airportResponse.ok) {
        console.warn(`AviationStack Airports API error: ${airportResponse.status}`);
        return null;
      }

      const airportData: AviationStackResponse<AviationStackAirport> = await airportResponse.json();
      
      if (!airportData.data || airportData.data.length === 0) {
        console.log(`No airport data found for ${upperIataCode}`);
        return null;
      }

      const airport = airportData.data[0];
      
      // Get city information if city_iata_code is available
      let cityInfo: AviationStackCity | null = null;
      if (airport.city_iata_code) {
        cityInfo = await this.getCityInfo(airport.city_iata_code);
      }

      // Get country information
      let countryInfo: AviationStackCountry | null = null;
      if (airport.country_iso2) {
        countryInfo = await this.getCountryInfo(airport.country_iso2);
      }

      const airportInfo: CachedAirportInfo = {
        name: airport.airport_name || `${upperIataCode} Airport`,
        city: cityInfo?.city_name || airport.city_iata_code || 'Unknown City',
        country: countryInfo?.country_name || airport.country_name || 'Unknown Country',
        iataCode: airport.iata_code || upperIataCode,
        icaoCode: airport.icao_code || '',
        timezone: airport.timezone || '',
        gmt: airport.gmt || '',
        latitude: airport.latitude || '',
        longitude: airport.longitude || '',
        timestamp: Date.now()
      };

      // Cache the result
      this.airportCache.set(upperIataCode, airportInfo);
      
      console.log(`✅ Found airport data for ${upperIataCode}: ${airportInfo.name} in ${airportInfo.city}, ${airportInfo.country}`);
      return airportInfo;

    } catch (error) {
      console.error('Error fetching airport data from AviationStack:', error);
      return null;
    }
  }

  /**
   * Get city information by IATA code
   */
  private async getCityInfo(cityIataCode: string): Promise<AviationStackCity | null> {
    const upperCityCode = cityIataCode.toUpperCase();
    
    // Check cache first
    const cached = this.cityCache.get(upperCityCode);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/cities?access_key=${this.API_KEY}&iata_code=${upperCityCode}&limit=1`
      );

      if (!response.ok) {
        console.warn(`AviationStack Cities API error: ${response.status}`);
        return null;
      }

      const data: AviationStackResponse<AviationStackCity> = await response.json();
      
      if (data.data && data.data.length > 0) {
        const city = data.data[0];
        this.cityCache.set(upperCityCode, city);
        return city;
      }

      return null;
    } catch (error) {
      console.error('Error fetching city data from AviationStack:', error);
      return null;
    }
  }

  /**
   * Get country information by ISO2 code
   */
  private async getCountryInfo(countryIso2: string): Promise<AviationStackCountry | null> {
    const upperCountryCode = countryIso2.toUpperCase();
    
    // Check cache first
    const cached = this.countryCache.get(upperCountryCode);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/countries?access_key=${this.API_KEY}&country_iso2=${upperCountryCode}&limit=1`
      );

      if (!response.ok) {
        console.warn(`AviationStack Countries API error: ${response.status}`);
        return null;
      }

      const data: AviationStackResponse<AviationStackCountry> = await response.json();
      
      if (data.data && data.data.length > 0) {
        const country = data.data[0];
        this.countryCache.set(upperCountryCode, country);
        return country;
      }

      return null;
    } catch (error) {
      console.error('Error fetching country data from AviationStack:', error);
      return null;
    }
  }

  /**
   * Search airports by name or code
   */
  async searchAirports(query: string, limit: number = 10): Promise<CachedAirportInfo[]> {
    if (!this.API_KEY) {
      console.warn('AviationStack API key not configured');
      return [];
    }

    try {
      console.log(`🔍 Searching airports for: ${query}`);
      
      const response = await fetch(
        `${this.BASE_URL}/airports?access_key=${this.API_KEY}&search=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        console.warn(`AviationStack API error: ${response.status}`);
        return [];
      }

      const data: AviationStackResponse<AviationStackAirport> = await response.json();
      
      if (!data.data || data.data.length === 0) {
        console.log(`No airports found for query: ${query}`);
        return [];
      }

      const airports: CachedAirportInfo[] = await Promise.all(
        data.data.map(async (airport) => {
          // Get city and country info for each airport
          let cityInfo: AviationStackCity | null = null;
          if (airport.city_iata_code) {
            cityInfo = await this.getCityInfo(airport.city_iata_code);
          }

          let countryInfo: AviationStackCountry | null = null;
          if (airport.country_iso2) {
            countryInfo = await this.getCountryInfo(airport.country_iso2);
          }

          return {
            name: airport.airport_name || `${airport.iata_code} Airport`,
            city: cityInfo?.city_name || airport.city_iata_code || 'Unknown City',
            country: countryInfo?.country_name || airport.country_name || 'Unknown Country',
            iataCode: airport.iata_code || '',
            icaoCode: airport.icao_code || '',
            timezone: airport.timezone || '',
            gmt: airport.gmt || '',
            latitude: airport.latitude || '',
            longitude: airport.longitude || '',
            timestamp: Date.now()
          };
        })
      );

      // Cache the results
      airports.forEach(airport => {
        this.airportCache.set(airport.iataCode, airport);
      });

      console.log(`✅ Found ${airports.length} airports for query: ${query}`);
      return airports;

    } catch (error) {
      console.error('Error searching airports from AviationStack:', error);
      return [];
    }
  }

  /**
   * Get multiple airports by IATA codes
   */
  async getAirportsByIataCodes(iataCodes: string[]): Promise<Map<string, CachedAirportInfo>> {
    const results = new Map<string, CachedAirportInfo>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < iataCodes.length; i += batchSize) {
      const batch = iataCodes.slice(i, i + batchSize);
      const promises = batch.map(async (code) => {
        const airport = await this.getAirportInfo(code);
        if (airport) {
          results.set(code.toUpperCase(), airport);
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
   * Clear all caches
   */
  clearCache(): void {
    this.airportCache.clear();
    this.cityCache.clear();
    this.countryCache.clear();
    console.log('🧹 Airport service cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { 
    airports: number; 
    cities: number; 
    countries: number; 
    airportKeys: string[] 
  } {
    return {
      airports: this.airportCache.size,
      cities: this.cityCache.size,
      countries: this.countryCache.size,
      airportKeys: Array.from(this.airportCache.keys())
    };
  }
}

// Export singleton instance
export const airportService = new AirportService();
export default airportService;
