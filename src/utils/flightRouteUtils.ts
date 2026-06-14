/**
 * Flight Route Utilities
 * Determines if a flight is domestic or international based on departure and arrival countries
 */

// Major airport to country mapping
const airportToCountry: Record<string, string> = {
  // India
  'DEL': 'IN', 'BOM': 'IN', 'BLR': 'IN', 'MAA': 'IN', 'HYD': 'IN', 'CCU': 'IN', 'AMD': 'IN', 'COK': 'IN', 'GOI': 'IN', 'PNQ': 'IN',
  'TRV': 'IN', 'IXB': 'IN', 'GAU': 'IN', 'IXC': 'IN', 'JAI': 'IN', 'SXR': 'IN', 'LKO': 'IN', 'IXL': 'IN', 'IXJ': 'IN', 'IXM': 'IN',
  'IXE': 'IN', 'IXU': 'IN', 'VGA': 'IN', 'VTZ': 'IN', 'IXZ': 'IN', 'BHO': 'IN', 'IDR': 'IN', 'JGA': 'IN', 'JLR': 'IN', 'KNU': 'IN',
  
  // United States
  'JFK': 'US', 'LAX': 'US', 'ORD': 'US', 'DFW': 'US', 'ATL': 'US', 'DEN': 'US', 'SFO': 'US', 'LAS': 'US', 'SEA': 'US', 'MIA': 'US',
  'PHX': 'US', 'IAH': 'US', 'MCO': 'US', 'BOS': 'US', 'DTW': 'US', 'MSP': 'US', 'PHL': 'US', 'LGA': 'US', 'BWI': 'US', 'IAD': 'US',
  'SLC': 'US', 'DCA': 'US', 'MDW': 'US', 'HNL': 'US', 'SAN': 'US', 'TPA': 'US', 'STL': 'US', 'BNA': 'US', 'AUS': 'US', 'PDX': 'US',
  
  // United Kingdom
  'LHR': 'GB', 'LGW': 'GB', 'STN': 'GB', 'LTN': 'GB', 'MAN': 'GB', 'BHX': 'GB', 'GLA': 'GB', 'EDI': 'GB', 'BRS': 'GB', 'NCL': 'GB',
  
  // Germany
  'FRA': 'DE', 'MUC': 'DE', 'DUS': 'DE', 'TXL': 'DE', 'SXF': 'DE', 'HAM': 'DE', 'STR': 'DE', 'CGN': 'DE', 'LEJ': 'DE', 'NUE': 'DE',
  
  // France
  'CDG': 'FR', 'ORY': 'FR', 'LYS': 'FR', 'MRS': 'FR', 'TLS': 'FR', 'NCE': 'FR', 'BOD': 'FR', 'LIL': 'FR', 'NTE': 'FR', 'SXB': 'FR',
  
  // UAE
  'DXB': 'AE', 'AUH': 'AE', 'SHJ': 'AE', 'DWC': 'AE', 'FJR': 'AE', 'RKT': 'AE',
  
  // Saudi Arabia
  'RUH': 'SA', 'JED': 'SA', 'DMM': 'SA', 'MED': 'SA', 'TIF': 'SA', 'ELQ': 'SA', 'URY': 'SA', 'BUR': 'SA', 'AHB': 'SA', 'GIZ': 'SA',
  
  // Qatar
  'DOH': 'QA', 'DIA': 'QA',
  
  // Singapore
  'SIN': 'SG', 'XSP': 'SG',
  
  // Thailand
  'BKK': 'TH', 'DMK': 'TH', 'CNX': 'TH', 'HKT': 'TH', 'UTP': 'TH', 'KBV': 'TH', 'USM': 'TH', 'NST': 'TH', 'HDY': 'TH', 'URT': 'TH',
  
  // Malaysia
  'KUL': 'MY', 'SZB': 'MY', 'PEN': 'MY', 'LGK': 'MY', 'KCH': 'MY', 'BKI': 'MY', 'TGG': 'MY', 'IPH': 'MY', 'JHB': 'MY', 'KBR': 'MY',
  
  // Indonesia
  'CGK': 'ID', 'DPS': 'ID', 'SUB': 'ID', 'UPG': 'ID', 'MDC': 'ID', 'PKU': 'ID', 'PLM': 'ID', 'BDO': 'ID', 'JOG': 'ID', 'SRG': 'ID',
  
  // Philippines
  'MNL': 'PH', 'CEB': 'PH', 'DVO': 'PH', 'ILO': 'PH', 'PPS': 'PH', 'ZAM': 'PH', 'TAG': 'PH', 'BCD': 'PH', 'CAG': 'PH', 'DGT': 'PH',
  
  // China
  'PEK': 'CN', 'PVG': 'CN', 'CAN': 'CN', 'SZX': 'CN', 'CTU': 'CN', 'XIY': 'CN', 'KMG': 'CN', 'TSN': 'CN', 'WUH': 'CN', 'NKG': 'CN',
  'HGH': 'CN', 'SJW': 'CN', 'TAO': 'CN', 'CKG': 'CN', 'FOC': 'CN', 'XMN': 'CN', 'HAK': 'CN', 'URC': 'CN', 'HRB': 'CN', 'DLC': 'CN',
  
  // Japan
  'NRT': 'JP', 'HND': 'JP', 'KIX': 'JP', 'CTS': 'JP', 'FUK': 'JP', 'NGO': 'JP', 'ITM': 'JP', 'OKA': 'JP', 'KOJ': 'JP', 'HIJ': 'JP',
  
  // South Korea
  'ICN': 'KR', 'GMP': 'KR', 'PUS': 'KR', 'CJU': 'KR', 'TAE': 'KR', 'KWJ': 'KR', 'USN': 'KR', 'WJU': 'KR', 'KUV': 'KR', 'RSU': 'KR',
  
  // Australia
  'SYD': 'AU', 'MEL': 'AU', 'BNE': 'AU', 'PER': 'AU', 'ADL': 'AU', 'CBR': 'AU', 'HBA': 'AU', 'DRW': 'AU', 'CNS': 'AU', 'OOL': 'AU',
  
  // Canada
  'YYZ': 'CA', 'YVR': 'CA', 'YUL': 'CA', 'YYC': 'CA', 'YEG': 'CA', 'YOW': 'CA', 'YHZ': 'CA', 'YWG': 'CA', 'YQB': 'CA', 'YQR': 'CA',
  
  // Brazil
  'GRU': 'BR', 'GIG': 'BR', 'BSB': 'BR', 'CNF': 'BR', 'CWB': 'BR', 'REC': 'BR', 'SSA': 'BR', 'POA': 'BR', 'FOR': 'BR', 'MAO': 'BR',
  
  // Mexico
  'MEX': 'MX', 'CUN': 'MX', 'GDL': 'MX', 'MTY': 'MX', 'TIJ': 'MX', 'CJS': 'MX', 'PVR': 'MX', 'SJD': 'MX', 'HMO': 'MX', 'VER': 'MX',
  
  // Turkey
  'IST': 'TR', 'SAW': 'TR', 'ESB': 'TR', 'ADB': 'TR', 'AYT': 'TR', 'BJV': 'TR', 'DLM': 'TR', 'GZT': 'TR', 'KCM': 'TR', 'ASR': 'TR',
  
  // Egypt
  'CAI': 'EG', 'HRG': 'EG', 'SSH': 'EG', 'LXR': 'EG', 'ASW': 'EG', 'HBE': 'EG', 'ALY': 'EG', 'ATZ': 'EG', 'DBB': 'EG', 'UVL': 'EG',
  
  // South Africa
  'JNB': 'ZA', 'CPT': 'ZA', 'DUR': 'ZA', 'PLZ': 'ZA', 'BFN': 'ZA', 'ELS': 'ZA', 'GRJ': 'ZA', 'HDS': 'ZA', 'KIM': 'ZA', 'MQP': 'ZA',
  
  // Nigeria
  'LOS': 'NG', 'ABV': 'NG', 'KAN': 'NG', 'PHC': 'NG', 'ENU': 'NG', 'KAD': 'NG', 'BAU': 'NG', 'ILR': 'NG', 'JOS': 'NG',
  
  // Kenya
  'NBO': 'KE', 'MBA': 'KE', 'KIS': 'KE', 'ELD': 'KE', 'GAR': 'KE', 'KSM': 'KE', 'LOK': 'KE', 'LUN': 'KE', 'MRE': 'KE', 'MYD': 'KE',
  
  // Morocco
  'CMN': 'MA', 'RBA': 'MA', 'AGA': 'MA', 'FEZ': 'MA', 'OUD': 'MA', 'TNG': 'MA', 'OZZ': 'MA', 'ERH': 'MA', 'ESU': 'MA', 'RAK': 'MA',
  
  // Add more airports as needed...
};

/**
 * Determines if a flight is domestic or international
 * @param flight - Flight object with itinerary segments
 * @returns 'domestic' | 'international' | 'unknown'
 */
export const getFlightRouteType = (flight: any): 'domestic' | 'international' | 'unknown' => {
  try {
    const segments = flight?.itineraries?.[0]?.segments || [];
    if (segments.length === 0) return 'unknown';
    
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const departureAirport = firstSegment?.departure?.iataCode;
    const arrivalAirport = lastSegment?.arrival?.iataCode;
    
    if (!departureAirport || !arrivalAirport) return 'unknown';
    
    const departureCountry = airportToCountry[departureAirport];
    const arrivalCountry = airportToCountry[arrivalAirport];
    
    if (!departureCountry || !arrivalCountry) return 'unknown';
    
    return departureCountry === arrivalCountry ? 'domestic' : 'international';
  } catch (error) {
    console.error('Error determining flight route type:', error);
    return 'unknown';
  }
};

/**
 * Gets the route description for display
 * @param flight - Flight object with itinerary segments
 * @returns Route description string
 */
export const getRouteDescription = (flight: any): string => {
  try {
    const segments = flight?.itineraries?.[0]?.segments || [];
    if (segments.length === 0) return 'Unknown route';
    
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const departureAirport = firstSegment?.departure?.iataCode;
    const arrivalAirport = lastSegment?.arrival?.iataCode;
    
    if (!departureAirport || !arrivalAirport) return 'Unknown route';
    
    const routeType = getFlightRouteType(flight);
    const route = `${departureAirport} to ${arrivalAirport}`;
    
    return routeType === 'domestic' ? `${route} (Domestic)` : 
           routeType === 'international' ? `${route} (International)` : 
           route;
  } catch (error) {
    console.error('Error getting route description:', error);
    return 'Unknown route';
  }
};

/**
 * Gets the airline code from flight
 * @param flight - Flight object
 * @returns Airline code string
 */
export const getAirlineCode = (flight: any): string => {
  try {
    return flight?.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Unknown';
  } catch (error) {
    console.error('Error getting airline code:', error);
    return 'Unknown';
  }
};
