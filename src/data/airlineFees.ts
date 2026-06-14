// Airline fee database with current pricing for major airlines
// This serves as a cache that gets validated with Sonar API
// NOTE: All prices are in the airline's typical operating currency
// Indian airlines (AI, 6E, SG, UK) = INR
// US airlines (AA, UA, DL, etc.) = USD
// European airlines = EUR (approximate)

export interface AirlineFees {
  bags: {
    first: number;
    second: number;
    third: number;
  };
  seats: {
    standard: number;
    extraLegroom: number;
    premium: number;
  };
  insurance: number;
  meals: {
    standard: number;
    premium: number;
  };
  loungeAccess: number;
  priorityBoarding: number;
}

export const airlineFeeDatabase: Record<string, AirlineFees> = {
  // American Airlines
  'AA': {
    bags: { first: 35, second: 45, third: 150 },
    seats: { standard: 0, extraLegroom: 40, premium: 85 },
    insurance: 29,
    meals: { standard: 12, premium: 25 },
    loungeAccess: 59,
    priorityBoarding: 15
  },

  // United Airlines
  'UA': {
    bags: { first: 35, second: 45, third: 150 },
    seats: { standard: 0, extraLegroom: 49, premium: 99 },
    insurance: 25,
    meals: { standard: 10, premium: 20 },
    loungeAccess: 59,
    priorityBoarding: 15
  },

  // Delta Air Lines
  'DL': {
    bags: { first: 30, second: 40, third: 150 },
    seats: { standard: 0, extraLegroom: 39, premium: 89 },
    insurance: 28,
    meals: { standard: 11, premium: 22 },
    loungeAccess: 59,
    priorityBoarding: 15
  },

  // Southwest Airlines
  'WN': {
    bags: { first: 0, second: 0, third: 75 }, // 2 free bags
    seats: { standard: 0, extraLegroom: 0, premium: 0 }, // No seat selection fees
    insurance: 20,
    meals: { standard: 8, premium: 15 },
    loungeAccess: 0, // No lounges
    priorityBoarding: 15
  },

  // JetBlue Airways
  'B6': {
    bags: { first: 35, second: 45, third: 150 },
    seats: { standard: 0, extraLegroom: 25, premium: 65 },
    insurance: 24,
    meals: { standard: 9, premium: 18 },
    loungeAccess: 0, // Limited lounges
    priorityBoarding: 12
  },

  // Alaska Airlines
  'AS': {
    bags: { first: 30, second: 40, third: 100 },
    seats: { standard: 0, extraLegroom: 35, premium: 75 },
    insurance: 26,
    meals: { standard: 10, premium: 20 },
    loungeAccess: 50,
    priorityBoarding: 12
  },

  // Spirit Airlines
  'NK': {
    bags: { first: 45, second: 55, third: 100 },
    seats: { standard: 0, extraLegroom: 20, premium: 50 },
    insurance: 22,
    meals: { standard: 5, premium: 10 },
    loungeAccess: 0, // No lounges
    priorityBoarding: 10
  },

  // Frontier Airlines
  'F9': {
    bags: { first: 40, second: 50, third: 90 },
    seats: { standard: 0, extraLegroom: 15, premium: 45 },
    insurance: 20,
    meals: { standard: 5, premium: 10 },
    loungeAccess: 0, // No lounges
    priorityBoarding: 8
  },

  // British Airways
  'BA': {
    bags: { first: 35, second: 45, third: 120 },
    seats: { standard: 0, extraLegroom: 45, premium: 95 },
    insurance: 30,
    meals: { standard: 15, premium: 30 },
    loungeAccess: 65,
    priorityBoarding: 18
  },

  // Lufthansa
  'LH': {
    bags: { first: 30, second: 40, third: 100 },
    seats: { standard: 0, extraLegroom: 40, premium: 85 },
    insurance: 28,
    meals: { standard: 12, premium: 25 },
    loungeAccess: 60,
    priorityBoarding: 15
  },

  // Air France
  'AF': {
    bags: { first: 30, second: 40, third: 100 },
    seats: { standard: 0, extraLegroom: 35, premium: 80 },
    insurance: 27,
    meals: { standard: 12, premium: 24 },
    loungeAccess: 55,
    priorityBoarding: 15
  },

  // KLM Royal Dutch Airlines
  'KL': {
    bags: { first: 30, second: 40, third: 100 },
    seats: { standard: 0, extraLegroom: 35, premium: 80 },
    insurance: 27,
    meals: { standard: 12, premium: 24 },
    loungeAccess: 55,
    priorityBoarding: 15
  },

  // Emirates
  'EK': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 50, premium: 120 },
    insurance: 35,
    meals: { standard: 20, premium: 40 },
    loungeAccess: 75,
    priorityBoarding: 20
  },

  // Qatar Airways
  'QR': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 45, premium: 110 },
    insurance: 32,
    meals: { standard: 18, premium: 35 },
    loungeAccess: 70,
    priorityBoarding: 18
  },

  // Singapore Airlines
  'SQ': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 40, premium: 100 },
    insurance: 30,
    meals: { standard: 15, premium: 30 },
    loungeAccess: 65,
    priorityBoarding: 15
  },

  // Cathay Pacific
  'CX': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 35, premium: 90 },
    insurance: 28,
    meals: { standard: 12, premium: 25 },
    loungeAccess: 60,
    priorityBoarding: 15
  },

  // Japan Airlines
  'JL': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 30, premium: 80 },
    insurance: 25,
    meals: { standard: 10, premium: 20 },
    loungeAccess: 55,
    priorityBoarding: 12
  },

  // All Nippon Airways
  'NH': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 30, premium: 80 },
    insurance: 25,
    meals: { standard: 10, premium: 20 },
    loungeAccess: 55,
    priorityBoarding: 12
  },

  // Air Canada
  'AC': {
    bags: { first: 30, second: 40, third: 100 },
    seats: { standard: 0, extraLegroom: 35, premium: 75 },
    insurance: 26,
    meals: { standard: 10, premium: 20 },
    loungeAccess: 50,
    priorityBoarding: 12
  },

  // WestJet
  'WS': {
    bags: { first: 30, second: 40, third: 100 },
    seats: { standard: 0, extraLegroom: 30, premium: 70 },
    insurance: 24,
    meals: { standard: 8, premium: 16 },
    loungeAccess: 45,
    priorityBoarding: 10
  },

  // Qantas
  'QF': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 35, premium: 85 },
    insurance: 28,
    meals: { standard: 12, premium: 24 },
    loungeAccess: 60,
    priorityBoarding: 15
  },

  // Virgin Australia
  'VA': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 30, premium: 75 },
    insurance: 25,
    meals: { standard: 10, premium: 20 },
    loungeAccess: 50,
    priorityBoarding: 12
  },

  // Turkish Airlines
  'TK': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 35, premium: 80 },
    insurance: 26,
    meals: { standard: 10, premium: 20 },
    loungeAccess: 55,
    priorityBoarding: 12
  },

  // Ethiopian Airlines
  'ET': {
    bags: { first: 0, second: 0, third: 100 }, // Generous baggage allowance
    seats: { standard: 0, extraLegroom: 30, premium: 70 },
    insurance: 24,
    meals: { standard: 8, premium: 16 },
    loungeAccess: 45,
    priorityBoarding: 10
  },

  // Air India (Updated with realistic INR pricing - 2024)
  'AI': {
    bags: { first: 2000, second: 3000, third: 5000 }, // ₹2000 for 1st extra bag (15kg)
    seats: { standard: 0, extraLegroom: 800, premium: 1500 }, // ₹800 for extra legroom
    insurance: 500, // ₹500 for basic travel insurance
    meals: { standard: 400, premium: 800 }, // ₹400 for standard meal, ₹800 for premium
    loungeAccess: 2000, // ₹2000 for lounge access
    priorityBoarding: 500 // ₹500 for priority boarding
  },

  // IndiGo (Updated with realistic INR pricing - 2024)
  '6E': {
    bags: { first: 700, second: 1400, third: 2500 }, // ₹700 for 5kg, ₹1400 for 10kg, ₹2500 for 15kg
    seats: { standard: 0, extraLegroom: 500, premium: 1000 }, // ₹500 for XL seats
    insurance: 299, // ₹299 for travel insurance
    meals: { standard: 200, premium: 400 }, // ₹200 for standard, ₹400 for premium
    loungeAccess: 0, // IndiGo doesn't have lounges
    priorityBoarding: 300 // ₹300 for SpeedyBoarding
  },

  // SpiceJet (Updated with realistic INR pricing - 2024)
  'SG': {
    bags: { first: 650, second: 1300, third: 2200 }, // ₹650 for 5kg, ₹1300 for 10kg
    seats: { standard: 0, extraLegroom: 400, premium: 800 }, // ₹400 for extra legroom
    insurance: 249, // ₹249 for travel insurance
    meals: { standard: 150, premium: 350 }, // ₹150 for standard, ₹350 for premium
    loungeAccess: 0, // SpiceJet doesn't have lounges
    priorityBoarding: 200 // ₹200 for priority check-in
  },

  // Vistara (Updated with realistic INR pricing - 2024)
  'UK': {
    bags: { first: 2500, second: 4000, third: 6000 }, // ₹2500 for 1st extra bag (23kg)
    seats: { standard: 0, extraLegroom: 1200, premium: 2500 }, // ₹1200 for extra legroom, ₹2500 for premium
    insurance: 699, // ₹699 for travel insurance
    meals: { standard: 500, premium: 1200 }, // ₹500 for standard, ₹1200 for premium
    loungeAccess: 2500, // ₹2500 for lounge access
    priorityBoarding: 600 // ₹600 for priority boarding
  },

  // AirAsia
  'AK': {
    bags: { first: 20, second: 30, third: 70 },
    seats: { standard: 0, extraLegroom: 10, premium: 30 },
    insurance: 18,
    meals: { standard: 5, premium: 10 },
    loungeAccess: 0, // No lounges
    priorityBoarding: 5
  },

  // Lion Air
  'JT': {
    bags: { first: 20, second: 30, third: 70 },
    seats: { standard: 0, extraLegroom: 10, premium: 30 },
    insurance: 18,
    meals: { standard: 5, premium: 10 },
    loungeAccess: 0, // No lounges
    priorityBoarding: 5
  },

  // Ryanair
  'FR': {
    bags: { first: 25, second: 35, third: 60 },
    seats: { standard: 0, extraLegroom: 12, premium: 25 },
    insurance: 15,
    meals: { standard: 5, premium: 10 },
    loungeAccess: 0, // No lounges
    priorityBoarding: 5
  },

  // EasyJet
  'U2': {
    bags: { first: 25, second: 35, third: 60 },
    seats: { standard: 0, extraLegroom: 12, premium: 25 },
    insurance: 15,
    meals: { standard: 5, premium: 10 },
    loungeAccess: 0, // No lounges
    priorityBoarding: 5
  },

  // Default fallback (Moderate USD pricing for unknown airlines)
  'default': {
    bags: { first: 35, second: 45, third: 150 },
    seats: { standard: 0, extraLegroom: 40, premium: 85 },
    insurance: 30,
    meals: { standard: 12, premium: 25 },
    loungeAccess: 60,
    priorityBoarding: 15
  }
};

/**
 * Currency note: Fees are stored in their native currency
 * - Indian carriers (AI, 6E, SG, UK): INR
 * - US carriers (AA, UA, DL, etc.): USD
 * - European carriers: EUR/GBP
 * The modal should detect the flight's currency and display accordingly
 */

/**
 * Get airline fees by airline code
 */
export const getAirlineFees = (airlineCode: string): AirlineFees => {
  return airlineFeeDatabase[airlineCode] || airlineFeeDatabase['default'];
};

/**
 * Check if airline has generous baggage allowance (typically international carriers)
 */
export const hasGenerousBaggage = (airlineCode: string): boolean => {
  const fees = getAirlineFees(airlineCode);
  return fees.bags.first === 0 && fees.bags.second === 0;
};

/**
 * Get fee category description
 */
export const getFeeCategory = (airlineCode: string): 'budget' | 'standard' | 'premium' => {
  const fees = getAirlineFees(airlineCode);
  
  if (fees.bags.first === 0) return 'premium'; // Generous baggage
  if (fees.bags.first <= 25) return 'budget'; // Low-cost carrier
  return 'standard'; // Traditional carrier
};
