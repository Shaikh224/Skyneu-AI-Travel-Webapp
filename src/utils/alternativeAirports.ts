// Alternative airports utility for finding nearby airports
// Maps major cities to their alternative airports

interface AirportInfo {
  code: string;
  name: string;
  city: string;
  country: string;
  distance: number; // km from city center
  transportTime: number; // minutes to city center
  transportCost: number; // USD
  transportType: string;
}

interface AlternativeAirportResult {
  fromAlts: AirportInfo[];
  toAlts: AirportInfo[];
  savings: {
    from: { airport: string; savings: number; netSavings: number }[];
    to: { airport: string; savings: number; netSavings: number }[];
  };
}

// Major city airport mappings
const alternativeAirportPairs: Record<string, AirportInfo[]> = {
  // New York Area
  'NYC': [
    { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', distance: 26, transportTime: 45, transportCost: 15, transportType: 'AirTrain + Subway' },
    { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'USA', distance: 16, transportTime: 30, transportCost: 12, transportType: 'NJ Transit' },
    { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'USA', distance: 13, transportTime: 25, transportCost: 8, transportType: 'Bus/Subway' }
  ],
  
  // London Area
  'LON': [
    { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK', distance: 24, transportTime: 45, transportCost: 12, transportType: 'Heathrow Express' },
    { code: 'LGW', name: 'Gatwick Airport', city: 'London', country: 'UK', distance: 47, transportTime: 60, transportCost: 18, transportType: 'Gatwick Express' },
    { code: 'STN', name: 'Stansted Airport', city: 'London', country: 'UK', distance: 64, transportTime: 75, transportCost: 20, transportType: 'Stansted Express' },
    { code: 'LTN', name: 'Luton Airport', city: 'London', country: 'UK', distance: 56, transportTime: 70, transportCost: 16, transportType: 'Luton Express' }
  ],
  
  // Paris Area
  'PAR': [
    { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', distance: 25, transportTime: 50, transportCost: 11, transportType: 'RER B' },
    { code: 'ORY', name: 'Orly Airport', city: 'Paris', country: 'France', distance: 18, transportTime: 35, transportCost: 8, transportType: 'RER C' }
  ],
  
  // Tokyo Area
  'TOK': [
    { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan', distance: 60, transportTime: 90, transportCost: 25, transportType: 'Narita Express' },
    { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', distance: 15, transportTime: 30, transportCost: 5, transportType: 'Monorail' }
  ],
  
  // Los Angeles Area
  'LAX': [
    { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', distance: 20, transportTime: 40, transportCost: 10, transportType: 'FlyAway Bus' },
    { code: 'BUR', name: 'Burbank Airport', city: 'Burbank', country: 'USA', distance: 15, transportTime: 25, transportCost: 8, transportType: 'Metro + Bus' },
    { code: 'LGB', name: 'Long Beach Airport', city: 'Long Beach', country: 'USA', distance: 30, transportTime: 45, transportCost: 12, transportType: 'Bus' }
  ],
  
  // San Francisco Area
  'SFO': [
    { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'USA', distance: 20, transportTime: 35, transportCost: 9, transportType: 'BART' },
    { code: 'OAK', name: 'Oakland International', city: 'Oakland', country: 'USA', distance: 15, transportTime: 30, transportCost: 7, transportType: 'BART' },
    { code: 'SJC', name: 'San Jose International', city: 'San Jose', country: 'USA', distance: 60, transportTime: 90, transportCost: 15, transportType: 'Caltrain + Bus' }
  ],
  
  // Chicago Area
  'CHI': [
    { code: 'ORD', name: 'O\'Hare International', city: 'Chicago', country: 'USA', distance: 27, transportTime: 50, transportCost: 5, transportType: 'Blue Line' },
    { code: 'MDW', name: 'Midway International', city: 'Chicago', country: 'USA', distance: 15, transportTime: 30, transportCost: 3, transportType: 'Orange Line' }
  ],
  
  // Miami Area
  'MIA': [
    { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'USA', distance: 13, transportTime: 25, transportCost: 6, transportType: 'Metrorail' },
    { code: 'FLL', name: 'Fort Lauderdale-Hollywood', city: 'Fort Lauderdale', country: 'USA', distance: 35, transportTime: 60, transportCost: 12, transportType: 'Tri-Rail' }
  ],
  
  // Dubai Area
  'DXB': [
    { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE', distance: 5, transportTime: 15, transportCost: 3, transportType: 'Metro' },
    { code: 'DWC', name: 'Al Maktoum International', city: 'Dubai', country: 'UAE', distance: 40, transportTime: 60, transportCost: 15, transportType: 'Bus' }
  ],
  
  // Singapore
  'SIN': [
    { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', distance: 20, transportTime: 30, transportCost: 2, transportType: 'MRT' }
  ],
  
  // Hong Kong
  'HKG': [
    { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', distance: 35, transportTime: 45, transportCost: 8, transportType: 'Airport Express' }
  ],
  
  // Sydney Area
  'SYD': [
    { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', distance: 8, transportTime: 20, transportCost: 4, transportType: 'Train' },
    { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', distance: 15, transportTime: 25, transportCost: 5, transportType: 'Airtrain' }
  ],
  
  // Toronto Area
  'TOR': [
    { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', distance: 27, transportTime: 50, transportCost: 12, transportType: 'UP Express' },
    { code: 'YTZ', name: 'Billy Bishop Toronto City', city: 'Toronto', country: 'Canada', distance: 2, transportTime: 10, transportCost: 3, transportType: 'Ferry' }
  ],
  
  // Mumbai Area
  'BOM': [
    { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', distance: 30, transportTime: 60, transportCost: 2, transportType: 'Local Train' },
    { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India', distance: 150, transportTime: 180, transportCost: 8, transportType: 'Bus/Train' }
  ],
  
  // Delhi Area
  'DEL': [
    { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', distance: 20, transportTime: 45, transportCost: 1, transportType: 'Metro' }
  ]
};

/**
 * Find alternative airports for a given city
 */
export const findAlternativeAirports = (from: string, to: string): AlternativeAirportResult => {
  const fromAlts = getAlternatives(from);
  const toAlts = getAlternatives(to);
  
  return {
    fromAlts,
    toAlts,
    savings: {
      from: calculateSavings(fromAlts),
      to: calculateSavings(toAlts)
    }
  };
};

/**
 * Get alternative airports for a city
 */
const getAlternatives = (cityCode: string): AirportInfo[] => {
  // Try exact match first
  if (alternativeAirportPairs[cityCode]) {
    return alternativeAirportPairs[cityCode];
  }
  
  // Try partial matches
  const normalizedCity = cityCode.toUpperCase();
  for (const [key, airports] of Object.entries(alternativeAirportPairs)) {
    if (key.includes(normalizedCity) || normalizedCity.includes(key)) {
      return airports;
    }
  }
  
  // Check if it's already an airport code
  for (const airports of Object.values(alternativeAirportPairs)) {
    const found = airports.find(airport => airport.code === cityCode);
    if (found) {
      return airports.filter(airport => airport.code !== cityCode);
    }
  }
  
  return [];
};

/**
 * Calculate potential savings for alternative airports
 */
const calculateSavings = (airports: AirportInfo[]): { airport: string; savings: number; netSavings: number }[] => {
  return airports.map(airport => {
    // Estimate potential savings (this would be calculated with real price data)
    const estimatedSavings = Math.floor(Math.random() * 200) + 50; // $50-250
    const netSavings = estimatedSavings - airport.transportCost;
    
    return {
      airport: airport.code,
      savings: estimatedSavings,
      netSavings: Math.max(0, netSavings)
    };
  });
};

/**
 * Get airport information by code
 */
export const getAirportInfo = (airportCode: string): AirportInfo | null => {
  for (const airports of Object.values(alternativeAirportPairs)) {
    const found = airports.find(airport => airport.code === airportCode);
    if (found) {
      return found;
    }
  }
  return null;
};

/**
 * Calculate total travel time including ground transport
 */
export const calculateTotalTravelTime = (
  flightTime: number, // minutes
  airport: AirportInfo
): number => {
  return flightTime + (airport.transportTime * 2); // Round trip
};

/**
 * Get best alternative airport based on total cost
 */
export const getBestAlternative = (
  alternatives: AirportInfo[],
  estimatedSavings: number[]
): AirportInfo | null => {
  if (alternatives.length === 0) return null;
  
  let bestIndex = 0;
  let bestNetSavings = estimatedSavings[0] - alternatives[0].transportCost;
  
  for (let i = 1; i < alternatives.length; i++) {
    const netSavings = estimatedSavings[i] - alternatives[i].transportCost;
    if (netSavings > bestNetSavings) {
      bestIndex = i;
      bestNetSavings = netSavings;
    }
  }
  
  return bestNetSavings > 0 ? alternatives[bestIndex] : null;
};

/**
 * Format alternative airport suggestion
 */
export const formatAlternativeSuggestion = (
  airport: AirportInfo,
  savings: number,
  netSavings: number
): string => {
  if (netSavings <= 0) {
    return `Fly from ${airport.code}: $${savings} cheaper but $${airport.transportCost} transport = no net savings`;
  }
  
  return `Fly from ${airport.code}: $${savings} cheaper + $${airport.transportCost} transport = $${netSavings} net savings`;
};

/**
 * Get all available city codes
 */
export const getAvailableCities = (): string[] => {
  return Object.keys(alternativeAirportPairs);
};

/**
 * Check if a city has alternative airports
 */
export const hasAlternatives = (cityCode: string): boolean => {
  return getAlternatives(cityCode).length > 0;
};
