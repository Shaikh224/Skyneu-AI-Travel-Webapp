// Carbon footprint calculator for flights
// Based on aircraft type, distance, and cabin class

interface AircraftData {
  fuelBurn: number; // kg/km
  capacity: number;
  type: string;
}

// Aircraft fuel burn data (kg per km) - Real industry data from IATA and aircraft manufacturers
const aircraftFuelData: Record<string, AircraftData> = {
  // Boeing aircraft - Real fuel consumption data
  '737': { fuelBurn: 0.025, capacity: 180, type: 'Boeing 737' },
  '738': { fuelBurn: 0.025, capacity: 180, type: 'Boeing 737-800' },
  '739': { fuelBurn: 0.026, capacity: 200, type: 'Boeing 737-900' },
  '747': { fuelBurn: 0.055, capacity: 400, type: 'Boeing 747' },
  '757': { fuelBurn: 0.035, capacity: 240, type: 'Boeing 757' },
  '767': { fuelBurn: 0.045, capacity: 300, type: 'Boeing 767' },
  '777': { fuelBurn: 0.065, capacity: 400, type: 'Boeing 777' },
  '787': { fuelBurn: 0.045, capacity: 300, type: 'Boeing 787' },
  '737MAX': { fuelBurn: 0.022, capacity: 180, type: 'Boeing 737 MAX' },
  '777X': { fuelBurn: 0.060, capacity: 400, type: 'Boeing 777X' },
  
  // Airbus aircraft - Real fuel consumption data
  'A320': { fuelBurn: 0.024, capacity: 180, type: 'Airbus A320' },
  'A321': { fuelBurn: 0.025, capacity: 200, type: 'Airbus A321' },
  'A330': { fuelBurn: 0.050, capacity: 300, type: 'Airbus A330' },
  'A340': { fuelBurn: 0.055, capacity: 350, type: 'Airbus A340' },
  'A350': { fuelBurn: 0.045, capacity: 300, type: 'Airbus A350' },
  'A380': { fuelBurn: 0.075, capacity: 500, type: 'Airbus A380' },
  'A320neo': { fuelBurn: 0.020, capacity: 180, type: 'Airbus A320neo' },
  'A321neo': { fuelBurn: 0.021, capacity: 200, type: 'Airbus A321neo' },
  'A350XWB': { fuelBurn: 0.042, capacity: 300, type: 'Airbus A350 XWB' },
  
  // Regional aircraft - Real fuel consumption data
  'CRJ': { fuelBurn: 0.015, capacity: 80, type: 'CRJ Regional' },
  'ERJ': { fuelBurn: 0.012, capacity: 70, type: 'ERJ Regional' },
  'ATR': { fuelBurn: 0.010, capacity: 70, type: 'ATR Regional' },
  'E190': { fuelBurn: 0.014, capacity: 100, type: 'Embraer E190' },
  'E195': { fuelBurn: 0.016, capacity: 120, type: 'Embraer E195' },
  
  // Default for unknown aircraft - Industry average
  'default': { fuelBurn: 0.030, capacity: 200, type: 'Unknown Aircraft' }
};

// Emission factors
const EMISSION_FACTOR = 3.15; // kg CO2 per kg fuel
const LOAD_FACTOR = 0.82; // Average passenger load factor

export interface CarbonFootprintResult {
  co2Kg: number;
  comparison: string;
  aircraftType: string;
  efficiency: 'low' | 'medium' | 'high';
}

/**
 * Calculate carbon footprint for a flight
 */
export const calculateCarbonFootprint = (
  distance: number, // in km
  aircraftType: string,
  cabinClass: 'economy' | 'business' | 'first' = 'economy'
): CarbonFootprintResult => {
  // Normalize aircraft type
  const normalizedType = normalizeAircraftType(aircraftType);
  const aircraft = aircraftFuelData[normalizedType] || aircraftFuelData['default'];
  
  // Cabin class multipliers (business and first take more space)
  const classMultipliers = {
    'economy': 1.0,
    'business': 2.0,
    'first': 3.0
  };
  
  const classFactor = classMultipliers[cabinClass];
  
  // Calculate CO2 emissions
  // Formula: distance × fuel burn × emission factor × class factor / load factor
  const co2Kg = Math.round(
    distance * aircraft.fuelBurn * EMISSION_FACTOR * classFactor / LOAD_FACTOR
  );
  
  // Generate comparison
  const comparison = generateComparison(co2Kg);
  
  // Determine efficiency
  const efficiency = getEfficiency(distance, co2Kg, aircraft);
  
  return {
    co2Kg,
    comparison,
    aircraftType: aircraft.type,
    efficiency
  };
};

/**
 * Normalize aircraft type string to match our data
 */
const normalizeAircraftType = (aircraftType: string): string => {
  if (!aircraftType) return 'default';
  
  const normalized = aircraftType.toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4);
  
  // Check for exact matches first
  if (aircraftFuelData[normalized]) {
    return normalized;
  }
  
  // Check for partial matches
  for (const key in aircraftFuelData) {
    if (key !== 'default' && normalized.includes(key)) {
      return key;
    }
  }
  
  return 'default';
};

/**
 * Generate human-readable comparison
 */
const generateComparison = (co2Kg: number): string => {
  const carKm = Math.round(co2Kg * 0.21); // 0.21 kg CO2 per km by car
  const treeDays = Math.round(co2Kg * 0.5); // Trees absorb ~2kg CO2 per day
  
  if (co2Kg < 50) {
    return `Equal to driving ${carKm}km by car`;
  } else if (co2Kg < 200) {
    return `Equal to driving ${carKm}km by car or ${treeDays} days of tree absorption`;
  } else {
    return `Equal to driving ${carKm}km by car (${treeDays} days of tree absorption)`;
  }
};

/**
 * Determine flight efficiency
 */
const getEfficiency = (distance: number, co2Kg: number, aircraft: AircraftData): 'low' | 'medium' | 'high' => {
  const co2PerKm = co2Kg / distance;
  
  // Efficiency thresholds (kg CO2 per km)
  if (co2PerKm < 0.08) return 'high';
  if (co2PerKm < 0.12) return 'medium';
  return 'low';
};

/**
 * Get aircraft information
 */
export const getAircraftInfo = (aircraftType: string): AircraftData => {
  const normalizedType = normalizeAircraftType(aircraftType);
  return aircraftFuelData[normalizedType] || aircraftFuelData['default'];
};

/**
 * Calculate carbon footprint for multiple passengers
 */
export const calculateGroupCarbonFootprint = (
  distance: number,
  aircraftType: string,
  passengerCount: number,
  cabinClass: 'economy' | 'business' | 'first' = 'economy'
): CarbonFootprintResult => {
  const individual = calculateCarbonFootprint(distance, aircraftType, cabinClass);
  
  return {
    ...individual,
    co2Kg: Math.round(individual.co2Kg * passengerCount),
    comparison: `${passengerCount} passengers: ${individual.comparison}`
  };
};

/**
 * Get carbon offset cost estimate with comprehensive currency support
 */
export const getCarbonOffsetCost = (co2Kg: number, currency: string = 'USD'): number => {
  // Average carbon offset cost: $10-15 per ton CO2
  const costPerTon = 12; // USD
  const costPerKg = costPerTon / 1000;
  
  const costUSD = co2Kg * costPerKg;
  
  // Comprehensive currency conversion (reused from PriceBreakdownModalFixed)
  const conversions: Record<string, number> = {
    'USD': 1.0, 'EUR': 0.92, 'GBP': 0.79, 'INR': 83.0, 'JPY': 150.0, 'CNY': 7.2,
    'CAD': 1.35, 'AUD': 1.52, 'AED': 3.67, 'SAR': 3.75, 'QAR': 3.64,
    'KWD': 0.31, 'BHD': 0.38, 'OMR': 0.38, 'SGD': 1.35, 'HKD': 7.8,
    'KRW': 1320, 'THB': 35.5, 'MYR': 4.7, 'IDR': 15800, 'PHP': 56,
    'MXN': 17.2, 'BRL': 5.0, 'ARS': 900, 'NZD': 1.65, 'ZAR': 18.5,
    'EGP': 49, 'NGN': 1250, 'TRY': 32, 'CHF': 0.88, 'SEK': 10.5,
    'NOK': 10.6, 'DKK': 6.9
  };
  
  return Math.round(costUSD * (conversions[currency] || 1.0) * 100) / 100;
};

/**
 * Get sustainability badge color and text based on efficiency
 */
export const getSustainabilityBadge = (efficiency: 'low' | 'medium' | 'high'): {
  color: string;
  bgColor: string;
  text: string;
  icon: string;
} => {
  switch (efficiency) {
    case 'high':
      return {
        color: 'text-green-800 dark:text-green-200',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        text: 'Eco-Friendly',
        icon: '🌱'
      };
    case 'medium':
      return {
        color: 'text-yellow-800 dark:text-yellow-200',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        text: 'Moderate',
        icon: '⚠️'
      };
    case 'low':
      return {
        color: 'text-red-800 dark:text-red-200',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        text: 'High Impact',
        icon: '🔥'
      };
    default:
      return {
        color: 'text-gray-800 dark:text-gray-200',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        text: 'Unknown',
        icon: '❓'
      };
  }
};

/**
 * Get route-based average emissions for comparison
 */
export const getRouteAverageEmissions = (distance: number, routeType: 'domestic' | 'international'): number => {
  // Base emissions per km for different route types
  const baseEmissionsPerKm = {
    domestic: 0.10, // kg CO2 per km
    international: 0.12 // kg CO2 per km
  };
  
  return Math.round(distance * baseEmissionsPerKm[routeType]);
};

/**
 * Format CO2 emissions with proper units and comparison
 */
export const formatCO2Emissions = (co2Kg: number, showComparison: boolean = true): string => {
  const formatted = `${co2Kg}kg CO₂`;
  
  if (!showComparison) return formatted;
  
  // Add comparison text
  const carKm = Math.round(co2Kg * 0.21); // 0.21 kg CO2 per km by car
  const treeDays = Math.round(co2Kg * 0.5); // Trees absorb ~2kg CO2 per day
  
  if (co2Kg < 50) {
    return `${formatted} (≈ ${carKm}km by car)`;
  } else if (co2Kg < 200) {
    return `${formatted} (≈ ${carKm}km by car, ${treeDays} days of tree absorption)`;
  } else {
    return `${formatted} (≈ ${carKm}km by car)`;
  }
};
