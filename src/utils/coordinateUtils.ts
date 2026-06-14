/**
 * Coordinate utilities for location mapping and geocoding
 * Provides fallback coordinate resolution without API costs
 */

// Enhanced location coordinates database with regional coverage
export const ENHANCED_LOCATION_COORDINATES: Record<string, { 
  lat: number; 
  lng: number; 
  country?: string;
  region?: string;
  aliases?: string[];
}> = {
  // UAE - Dubai & Abu Dhabi
  'Dubai': { lat: 25.2048, lng: 55.2708, country: 'UAE', region: 'Middle East' },
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773, country: 'UAE', region: 'Middle East' },
  'Burj Khalifa': { lat: 25.1972, lng: 55.2744, country: 'UAE', aliases: ['Burj Khalifa Dubai', 'Khalifa Tower'] },
  'Dubai Mall': { lat: 25.1975, lng: 55.2796, country: 'UAE', aliases: ['The Dubai Mall'] },
  'Palm Jumeirah': { lat: 25.1124, lng: 55.1390, country: 'UAE', aliases: ['Palm Island'] },
  'Burj Al Arab': { lat: 25.1413, lng: 55.1853, country: 'UAE', aliases: ['Burj Al Arab Hotel'] },
  'Dubai Marina': { lat: 25.0807, lng: 55.1397, country: 'UAE' },
  'Dubai Creek': { lat: 25.2677, lng: 55.3078, country: 'UAE' },
  'Gold Souk': { lat: 25.2677, lng: 55.2962, country: 'UAE', aliases: ['Gold Souk Dubai'] },
  'Spice Souk': { lat: 25.2685, lng: 55.2975, country: 'UAE', aliases: ['Spice Bazaar Dubai'] },
  'Atlantis The Palm': { lat: 25.1308, lng: 55.1177, country: 'UAE', aliases: ['Atlantis Dubai'] },
  'Dubai International Airport': { lat: 25.2532, lng: 55.3657, country: 'UAE', aliases: ['DXB'] },

  // France - Paris & other cities
  'Paris': { lat: 48.8566, lng: 2.3522, country: 'France', region: 'Europe' },
  'Lyon': { lat: 45.7640, lng: 4.8357, country: 'France', region: 'Europe' },
  'Marseille': { lat: 43.2965, lng: 5.3698, country: 'France', region: 'Europe' },
  'Eiffel Tower': { lat: 48.8584, lng: 2.2945, country: 'France', aliases: ['Tour Eiffel'] },
  'Louvre Museum': { lat: 48.8606, lng: 2.3376, country: 'France', aliases: ['The Louvre', 'Musée du Louvre'] },
  'Notre Dame': { lat: 48.8530, lng: 2.3499, country: 'France', aliases: ['Notre Dame Cathedral', 'Notre-Dame de Paris'] },
  'Arc de Triomphe': { lat: 48.8738, lng: 2.2950, country: 'France' },
  'Champs Elysees': { lat: 48.8698, lng: 2.3076, country: 'France', aliases: ['Champs-Élysées'] },
  'Sacre Coeur': { lat: 48.8867, lng: 2.3431, country: 'France', aliases: ['Sacré-Cœur'] },
  'Montmartre': { lat: 48.8867, lng: 2.3431, country: 'France' },
  'Seine River': { lat: 48.8566, lng: 2.3522, country: 'France' },
  'Versailles': { lat: 48.8049, lng: 2.1204, country: 'France', aliases: ['Palace of Versailles'] },
  'Charles de Gaulle Airport': { lat: 49.0097, lng: 2.5479, country: 'France', aliases: ['CDG'] },

  // UK - London & other cities
  'London': { lat: 51.5074, lng: -0.1278, country: 'UK', region: 'Europe' },
  'Edinburgh': { lat: 55.9533, lng: -3.1883, country: 'UK', region: 'Europe' },
  'Manchester': { lat: 53.4808, lng: -2.2426, country: 'UK', region: 'Europe' },
  'Big Ben': { lat: 51.4994, lng: -0.1245, country: 'UK', aliases: ['Elizabeth Tower'] },
  'Tower Bridge': { lat: 51.5055, lng: -0.0754, country: 'UK' },
  'London Eye': { lat: 51.5033, lng: -0.1195, country: 'UK' },
  'Buckingham Palace': { lat: 51.5014, lng: -0.1419, country: 'UK' },
  'Westminster Abbey': { lat: 51.4994, lng: -0.1270, country: 'UK' },
  'Hyde Park': { lat: 51.5074, lng: -0.1657, country: 'UK' },
  'British Museum': { lat: 51.5194, lng: -0.1270, country: 'UK' },
  'Tower of London': { lat: 51.5081, lng: -0.0759, country: 'UK' },
  'Camden Market': { lat: 51.5441, lng: -0.1435, country: 'UK' },
  'Heathrow Airport': { lat: 51.4700, lng: -0.4543, country: 'UK', aliases: ['LHR'] },

  // Japan - Tokyo & other cities
  'Tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan', region: 'Asia' },
  'Osaka': { lat: 34.6937, lng: 135.5023, country: 'Japan', region: 'Asia' },
  'Kyoto': { lat: 35.0116, lng: 135.7681, country: 'Japan', region: 'Asia' },
  'Tokyo Tower': { lat: 35.6586, lng: 139.7454, country: 'Japan' },
  'Shibuya Crossing': { lat: 35.6598, lng: 139.7006, country: 'Japan', aliases: ['Shibuya'] },
  'Sensoji Temple': { lat: 35.7148, lng: 139.7967, country: 'Japan', aliases: ['Senso-ji'] },
  'Meiji Shrine': { lat: 35.6761, lng: 139.6993, country: 'Japan' },
  'Tsukiji Fish Market': { lat: 35.6654, lng: 139.7707, country: 'Japan', aliases: ['Tsukiji Market'] },
  'Ginza': { lat: 35.6762, lng: 139.7675, country: 'Japan' },
  'Harajuku': { lat: 35.6702, lng: 139.7026, country: 'Japan' },
  'Tokyo Skytree': { lat: 35.7101, lng: 139.8107, country: 'Japan' },
  'Imperial Palace': { lat: 35.6852, lng: 139.7528, country: 'Japan', aliases: ['Tokyo Imperial Palace'] },
  'Narita Airport': { lat: 35.7720, lng: 140.3929, country: 'Japan', aliases: ['NRT'] },

  // USA - Multiple cities
  'New York': { lat: 40.7128, lng: -74.0060, country: 'USA', region: 'North America', aliases: ['NYC', 'New York City'] },
  'Los Angeles': { lat: 34.0522, lng: -118.2437, country: 'USA', region: 'North America', aliases: ['LA'] },
  'Chicago': { lat: 41.8781, lng: -87.6298, country: 'USA', region: 'North America' },
  'San Francisco': { lat: 37.7749, lng: -122.4194, country: 'USA', region: 'North America' },
  'Times Square': { lat: 40.7580, lng: -73.9855, country: 'USA' },
  'Central Park': { lat: 40.7829, lng: -73.9654, country: 'USA' },
  'Statue of Liberty': { lat: 40.6892, lng: -74.0445, country: 'USA' },
  'Empire State Building': { lat: 40.7484, lng: -73.9857, country: 'USA' },
  'Brooklyn Bridge': { lat: 40.7061, lng: -73.9969, country: 'USA' },
  'One World Trade Center': { lat: 40.7127, lng: -74.0134, country: 'USA', aliases: ['Freedom Tower'] },
  'JFK Airport': { lat: 40.6413, lng: -73.7781, country: 'USA', aliases: ['John F. Kennedy Airport'] },

  // Italy - Multiple cities
  'Rome': { lat: 41.9028, lng: 12.4964, country: 'Italy', region: 'Europe' },
  'Milan': { lat: 45.4642, lng: 9.1900, country: 'Italy', region: 'Europe' },
  'Venice': { lat: 45.4408, lng: 12.3155, country: 'Italy', region: 'Europe' },
  'Florence': { lat: 43.7696, lng: 11.2558, country: 'Italy', region: 'Europe' },
  'Colosseum': { lat: 41.8902, lng: 12.4922, country: 'Italy' },
  'Vatican City': { lat: 41.9029, lng: 12.4534, country: 'Vatican' },
  'Trevi Fountain': { lat: 41.9009, lng: 12.4833, country: 'Italy' },
  'Roman Forum': { lat: 41.8925, lng: 12.4853, country: 'Italy' },
  'Pantheon': { lat: 41.8986, lng: 12.4769, country: 'Italy' },
  'Spanish Steps': { lat: 41.9057, lng: 12.4823, country: 'Italy' },

  // Asia - Major destinations
  'Singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore', region: 'Asia' },
  'Marina Bay Sands': { lat: 1.2834, lng: 103.8607, country: 'Singapore' },
  'Gardens by the Bay': { lat: 1.2816, lng: 103.8636, country: 'Singapore' },
  'Sentosa Island': { lat: 1.2494, lng: 103.8303, country: 'Singapore' },

  'Bangkok': { lat: 13.7563, lng: 100.5018, country: 'Thailand', region: 'Asia' },
  'Grand Palace Bangkok': { lat: 13.7500, lng: 100.4910, country: 'Thailand' },
  'Wat Pho': { lat: 13.7467, lng: 100.4925, country: 'Thailand' },
  'Khao San Road': { lat: 13.7590, lng: 100.4977, country: 'Thailand' },

  'Hong Kong': { lat: 22.3193, lng: 114.1694, country: 'Hong Kong', region: 'Asia' },
  'Seoul': { lat: 37.5665, lng: 126.9780, country: 'South Korea', region: 'Asia' },
  'Beijing': { lat: 39.9042, lng: 116.4074, country: 'China', region: 'Asia' },
  'Shanghai': { lat: 31.2304, lng: 121.4737, country: 'China', region: 'Asia' },

  // Europe - More cities
  'Barcelona': { lat: 41.3851, lng: 2.1734, country: 'Spain', region: 'Europe' },
  'Madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain', region: 'Europe' },
  'Sagrada Familia': { lat: 41.4036, lng: 2.1744, country: 'Spain' },
  'Park Guell': { lat: 41.4145, lng: 2.1527, country: 'Spain' },
  'Las Ramblas': { lat: 41.3811, lng: 2.1763, country: 'Spain' },

  'Amsterdam': { lat: 52.3676, lng: 4.9041, country: 'Netherlands', region: 'Europe' },
  'Berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany', region: 'Europe' },
  'Munich': { lat: 48.1351, lng: 11.5820, country: 'Germany', region: 'Europe' },
  'Vienna': { lat: 48.2082, lng: 16.3738, country: 'Austria', region: 'Europe' },
  'Prague': { lat: 50.0755, lng: 14.4378, country: 'Czech Republic', region: 'Europe' },
  'Stockholm': { lat: 59.3293, lng: 18.0686, country: 'Sweden', region: 'Europe' },

  'Istanbul': { lat: 41.0082, lng: 28.9784, country: 'Turkey', region: 'Europe/Asia' },
  'Hagia Sophia': { lat: 41.0086, lng: 28.9802, country: 'Turkey' },
  'Blue Mosque': { lat: 41.0054, lng: 28.9768, country: 'Turkey' },
  'Grand Bazaar': { lat: 41.0104, lng: 28.9681, country: 'Turkey' },

  // Australia & Oceania
  'Sydney': { lat: -33.8688, lng: 151.2093, country: 'Australia', region: 'Oceania' },
  'Melbourne': { lat: -37.8136, lng: 144.9631, country: 'Australia', region: 'Oceania' },
  'Brisbane': { lat: -27.4698, lng: 153.0251, country: 'Australia', region: 'Oceania' },
  'Sydney Opera House': { lat: -33.8568, lng: 151.2153, country: 'Australia' },
  'Sydney Harbour Bridge': { lat: -33.8523, lng: 151.2108, country: 'Australia' },
  'Bondi Beach': { lat: -33.8915, lng: 151.2767, country: 'Australia' },

  // Africa
  'Cairo': { lat: 30.0444, lng: 31.2357, country: 'Egypt', region: 'Africa' },
  'Cape Town': { lat: -33.9249, lng: 18.4241, country: 'South Africa', region: 'Africa' },
  'Marrakech': { lat: 31.6295, lng: -7.9811, country: 'Morocco', region: 'Africa' },

  // South America
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729, country: 'Brazil', region: 'South America' },
  'Buenos Aires': { lat: -34.6118, lng: -58.3960, country: 'Argentina', region: 'South America' },
  'Lima': { lat: -12.0464, lng: -77.0428, country: 'Peru', region: 'South America' },

  // Canada
  'Toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada', region: 'North America' },
  'Vancouver': { lat: 49.2827, lng: -123.1207, country: 'Canada', region: 'North America' },
  'Montreal': { lat: 45.5017, lng: -73.5673, country: 'Canada', region: 'North America' },
};

/**
 * Enhanced coordinate finder with multiple fallback strategies
 */
export function findLocationCoordinates(
  locationName: string, 
  providedCoords?: { lat: number; lng: number },
  contextCountry?: string
): { lat: number; lng: number; source: 'provided' | 'exact' | 'fuzzy' | 'default'; confidence: number } {
  
  // Strategy 1: Use AI-provided coordinates if available and valid
  if (providedCoords && 
      typeof providedCoords.lat === 'number' && 
      typeof providedCoords.lng === 'number' &&
      providedCoords.lat >= -90 && providedCoords.lat <= 90 &&
      providedCoords.lng >= -180 && providedCoords.lng <= 180) {
    return { 
      lat: providedCoords.lat, 
      lng: providedCoords.lng, 
      source: 'provided',
      confidence: 1.0 
    };
  }

  const normalizedSearch = locationName.toLowerCase().trim();

  // Strategy 2: Exact match in database
  if (ENHANCED_LOCATION_COORDINATES[locationName]) {
    const coords = ENHANCED_LOCATION_COORDINATES[locationName];
    return { 
      lat: coords.lat, 
      lng: coords.lng, 
      source: 'exact',
      confidence: 0.95 
    };
  }

  // Strategy 3: Check aliases
  for (const [, data] of Object.entries(ENHANCED_LOCATION_COORDINATES)) {
    if (data.aliases) {
      for (const alias of data.aliases) {
        if (alias.toLowerCase() === normalizedSearch) {
          return { 
            lat: data.lat, 
            lng: data.lng, 
            source: 'exact',
            confidence: 0.9 
          };
        }
      }
    }
  }

  // Strategy 4: Fuzzy search with country context
  let bestMatch: { key: string; data: any; score: number } | null = null;
  
  for (const [key, data] of Object.entries(ENHANCED_LOCATION_COORDINATES)) {
    const keyLower = key.toLowerCase();
    let score = 0;

    // Exact substring match
    if (keyLower.includes(normalizedSearch) || normalizedSearch.includes(keyLower)) {
      score += 0.7;
      
      // Bonus for country context match
      if (contextCountry && data.country?.toLowerCase() === contextCountry.toLowerCase()) {
        score += 0.3;
      }
      
      // Bonus for exact word match
      const searchWords = normalizedSearch.split(' ');
      const keyWords = keyLower.split(' ');
      const wordMatches = searchWords.filter(word => keyWords.includes(word));
      score += (wordMatches.length / searchWords.length) * 0.2;
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { key, data, score };
      }
    }
  }

  if (bestMatch && bestMatch.score > 0.5) {
    return { 
      lat: bestMatch.data.lat, 
      lng: bestMatch.data.lng, 
      source: 'fuzzy',
      confidence: bestMatch.score 
    };
  }

  // Strategy 5: Default coordinates (Dubai as global center)
  return { 
    lat: 25.2048, 
    lng: 55.2708, 
    source: 'default',
    confidence: 0.1 
  };
}

/**
 * Get popular destinations for a country
 */
export function getPopularDestinations(country: string): string[] {
  const destinations = Object.entries(ENHANCED_LOCATION_COORDINATES)
    .filter(([, data]) => data.country?.toLowerCase() === country.toLowerCase())
    .map(([locationName]) => locationName);
  
  return destinations.slice(0, 10); // Return top 10
}

/**
 * Get approximate distance between two coordinates (in km)
 */
export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Validate coordinate format
 */
export function isValidCoordinate(coord: any): coord is { lat: number; lng: number } {
  return coord && 
         typeof coord.lat === 'number' && 
         typeof coord.lng === 'number' &&
         coord.lat >= -90 && coord.lat <= 90 &&
         coord.lng >= -180 && coord.lng <= 180;
}

/**
 * Log coordinate resolution for debugging
 */
export function logCoordinateResolution(
  locationName: string, 
  result: ReturnType<typeof findLocationCoordinates>
): void {
  const emoji = {
    provided: '🎯',
    exact: '✅',
    fuzzy: '🔍',
    default: '⚠️'
  };
  
}
