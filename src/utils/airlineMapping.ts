/**
 * Airline IATA Code Mapping
 * Comprehensive mapping of IATA codes to airline names and domains
 */

export interface AirlineInfo {
  code: string;
  name: string;
  fullName: string;
  domain: string;
  region: string;
  country: string;
}

export const airlineMapping: Record<string, AirlineInfo> = {
  // Indian Airlines
  'AI': { code: 'AI', name: 'Air India', fullName: 'Air India Limited', domain: 'airindia.com', region: 'Asia', country: 'India' },
  '6E': { code: '6E', name: 'IndiGo', fullName: 'InterGlobe Aviation Limited', domain: 'goindigo.in', region: 'Asia', country: 'India' },
  'SG': { code: 'SG', name: 'SpiceJet', fullName: 'SpiceJet Limited', domain: 'spicejet.com', region: 'Asia', country: 'India' },
  'UK': { code: 'UK', name: 'Vistara', fullName: 'TATA SIA Airlines Limited', domain: 'airvistara.com', region: 'Asia', country: 'India' },
  'I5': { code: 'I5', name: 'AirAsia India', fullName: 'AirAsia India', domain: 'airasia.com', region: 'Asia', country: 'India' },
  'G8': { code: 'G8', name: 'Go First', fullName: 'Go Airlines (India) Limited', domain: 'flygofirst.com', region: 'Asia', country: 'India' },
  'QP': { code: 'QP', name: 'Akasa Air', fullName: 'Akasa Air', domain: 'akasaair.com', region: 'Asia', country: 'India' },
  
  // Gulf/Middle Eastern Airlines
  'EK': { code: 'EK', name: 'Emirates', fullName: 'Emirates Airlines', domain: 'emirates.com', region: 'Middle East', country: 'UAE' },
  'EY': { code: 'EY', name: 'Etihad', fullName: 'Etihad Airways', domain: 'etihad.com', region: 'Middle East', country: 'UAE' },
  'QR': { code: 'QR', name: 'Qatar Airways', fullName: 'Qatar Airways', domain: 'qatarairways.com', region: 'Middle East', country: 'Qatar' },
  'SV': { code: 'SV', name: 'Saudia', fullName: 'Saudi Arabian Airlines', domain: 'saudia.com', region: 'Middle East', country: 'Saudi Arabia' },
  'KU': { code: 'KU', name: 'Kuwait Airways', fullName: 'Kuwait Airways', domain: 'kuwaitairways.com', region: 'Middle East', country: 'Kuwait' },
  'GF': { code: 'GF', name: 'Gulf Air', fullName: 'Gulf Air', domain: 'gulfair.com', region: 'Middle East', country: 'Bahrain' },
  'WY': { code: 'WY', name: 'Oman Air', fullName: 'Oman Air', domain: 'omanair.com', region: 'Middle East', country: 'Oman' },
  'FZ': { code: 'FZ', name: 'flydubai', fullName: 'flydubai', domain: 'flydubai.com', region: 'Middle East', country: 'UAE' },
  'G9': { code: 'G9', name: 'Air Arabia', fullName: 'Air Arabia', domain: 'airarabia.com', region: 'Middle East', country: 'UAE' },
  'XY': { code: 'XY', name: 'flynas', fullName: 'flynas', domain: 'flynas.com', region: 'Middle East', country: 'Saudi Arabia' },
  
  // European Airlines
  'LH': { code: 'LH', name: 'Lufthansa', fullName: 'Deutsche Lufthansa AG', domain: 'lufthansa.com', region: 'Europe', country: 'Germany' },
  'AF': { code: 'AF', name: 'Air France', fullName: 'Air France', domain: 'airfrance.com', region: 'Europe', country: 'France' },
  'KL': { code: 'KL', name: 'KLM', fullName: 'KLM Royal Dutch Airlines', domain: 'klm.com', region: 'Europe', country: 'Netherlands' },
  'BA': { code: 'BA', name: 'British Airways', fullName: 'British Airways', domain: 'britishairways.com', region: 'Europe', country: 'United Kingdom' },
  'IB': { code: 'IB', name: 'Iberia', fullName: 'Iberia Airlines', domain: 'iberia.com', region: 'Europe', country: 'Spain' },
  'AZ': { code: 'AZ', name: 'ITA Airways', fullName: 'ITA Airways', domain: 'ita-airways.com', region: 'Europe', country: 'Italy' },
  'LX': { code: 'LX', name: 'Swiss', fullName: 'Swiss International Air Lines', domain: 'swiss.com', region: 'Europe', country: 'Switzerland' },
  'OS': { code: 'OS', name: 'Austrian', fullName: 'Austrian Airlines', domain: 'austrian.com', region: 'Europe', country: 'Austria' },
  'SK': { code: 'SK', name: 'SAS', fullName: 'Scandinavian Airlines', domain: 'flysas.com', region: 'Europe', country: 'Sweden' },
  'AY': { code: 'AY', name: 'Finnair', fullName: 'Finnair', domain: 'finnair.com', region: 'Europe', country: 'Finland' },
  'TP': { code: 'TP', name: 'TAP Air Portugal', fullName: 'TAP Air Portugal', domain: 'flytap.com', region: 'Europe', country: 'Portugal' },
  'SN': { code: 'SN', name: 'Brussels Airlines', fullName: 'Brussels Airlines', domain: 'brusselsairlines.com', region: 'Europe', country: 'Belgium' },
  'LO': { code: 'LO', name: 'LOT Polish', fullName: 'LOT Polish Airlines', domain: 'lot.com', region: 'Europe', country: 'Poland' },
  'TK': { code: 'TK', name: 'Turkish Airlines', fullName: 'Turkish Airlines', domain: 'turkishairlines.com', region: 'Europe', country: 'Turkey' },
  
  // Asian Airlines
  'SQ': { code: 'SQ', name: 'Singapore Airlines', fullName: 'Singapore Airlines', domain: 'singaporeair.com', region: 'Asia', country: 'Singapore' },
  'CX': { code: 'CX', name: 'Cathay Pacific', fullName: 'Cathay Pacific Airways', domain: 'cathaypacific.com', region: 'Asia', country: 'Hong Kong' },
  'NH': { code: 'NH', name: 'ANA', fullName: 'All Nippon Airways', domain: 'ana.co.jp', region: 'Asia', country: 'Japan' },
  'JL': { code: 'JL', name: 'Japan Airlines', fullName: 'Japan Airlines', domain: 'jal.com', region: 'Asia', country: 'Japan' },
  'KE': { code: 'KE', name: 'Korean Air', fullName: 'Korean Air', domain: 'koreanair.com', region: 'Asia', country: 'South Korea' },
  'OZ': { code: 'OZ', name: 'Asiana', fullName: 'Asiana Airlines', domain: 'flyasiana.com', region: 'Asia', country: 'South Korea' },
  'TG': { code: 'TG', name: 'Thai Airways', fullName: 'Thai Airways International', domain: 'thaiairways.com', region: 'Asia', country: 'Thailand' },
  'MH': { code: 'MH', name: 'Malaysia Airlines', fullName: 'Malaysia Airlines', domain: 'malaysiaairlines.com', region: 'Asia', country: 'Malaysia' },
  'GA': { code: 'GA', name: 'Garuda Indonesia', fullName: 'Garuda Indonesia', domain: 'garuda-indonesia.com', region: 'Asia', country: 'Indonesia' },
  'PR': { code: 'PR', name: 'Philippine Airlines', fullName: 'Philippine Airlines', domain: 'philippineairlines.com', region: 'Asia', country: 'Philippines' },
  'CI': { code: 'CI', name: 'China Airlines', fullName: 'China Airlines', domain: 'china-airlines.com', region: 'Asia', country: 'Taiwan' },
  'BR': { code: 'BR', name: 'EVA Air', fullName: 'EVA Airways', domain: 'evaair.com', region: 'Asia', country: 'Taiwan' },
  'CA': { code: 'CA', name: 'Air China', fullName: 'Air China', domain: 'airchina.com', region: 'Asia', country: 'China' },
  'CZ': { code: 'CZ', name: 'China Southern', fullName: 'China Southern Airlines', domain: 'csair.com', region: 'Asia', country: 'China' },
  'MU': { code: 'MU', name: 'China Eastern', fullName: 'China Eastern Airlines', domain: 'ceair.com', region: 'Asia', country: 'China' },
  
  // American Airlines
  'AA': { code: 'AA', name: 'American Airlines', fullName: 'American Airlines', domain: 'aa.com', region: 'North America', country: 'USA' },
  'DL': { code: 'DL', name: 'Delta', fullName: 'Delta Air Lines', domain: 'delta.com', region: 'North America', country: 'USA' },
  'UA': { code: 'UA', name: 'United', fullName: 'United Airlines', domain: 'united.com', region: 'North America', country: 'USA' },
  'WN': { code: 'WN', name: 'Southwest', fullName: 'Southwest Airlines', domain: 'southwest.com', region: 'North America', country: 'USA' },
  'B6': { code: 'B6', name: 'JetBlue', fullName: 'JetBlue Airways', domain: 'jetblue.com', region: 'North America', country: 'USA' },
  'AS': { code: 'AS', name: 'Alaska Airlines', fullName: 'Alaska Airlines', domain: 'alaskaair.com', region: 'North America', country: 'USA' },
  'AC': { code: 'AC', name: 'Air Canada', fullName: 'Air Canada', domain: 'aircanada.com', region: 'North America', country: 'Canada' },
  'WS': { code: 'WS', name: 'WestJet', fullName: 'WestJet', domain: 'westjet.com', region: 'North America', country: 'Canada' },
  'AM': { code: 'AM', name: 'Aeroméxico', fullName: 'Aeroméxico', domain: 'aeromexico.com', region: 'North America', country: 'Mexico' },
  
  // South American Airlines
  'AV': { code: 'AV', name: 'Avianca', fullName: 'Avianca', domain: 'avianca.com', region: 'South America', country: 'Colombia' },
  'CM': { code: 'CM', name: 'Copa Airlines', fullName: 'Copa Airlines', domain: 'copa.com', region: 'South America', country: 'Panama' },
  'LA': { code: 'LA', name: 'LATAM', fullName: 'LATAM Airlines', domain: 'latam.com', region: 'South America', country: 'Chile' },
  'AR': { code: 'AR', name: 'Aerolíneas Argentinas', fullName: 'Aerolíneas Argentinas', domain: 'aerolineas.com.ar', region: 'South America', country: 'Argentina' },
  'G3': { code: 'G3', name: 'GOL', fullName: 'GOL Linhas Aéreas', domain: 'voegol.com.br', region: 'South America', country: 'Brazil' },
  
  // Oceania Airlines
  'QF': { code: 'QF', name: 'Qantas', fullName: 'Qantas Airways', domain: 'qantas.com', region: 'Oceania', country: 'Australia' },
  'VA': { code: 'VA', name: 'Virgin Australia', fullName: 'Virgin Australia', domain: 'virginaustralia.com', region: 'Oceania', country: 'Australia' },
  'NZ': { code: 'NZ', name: 'Air New Zealand', fullName: 'Air New Zealand', domain: 'airnewzealand.com', region: 'Oceania', country: 'New Zealand' },
  
  // African Airlines
  'SA': { code: 'SA', name: 'South African Airways', fullName: 'South African Airways', domain: 'flysaa.com', region: 'Africa', country: 'South Africa' },
  'ET': { code: 'ET', name: 'Ethiopian Airlines', fullName: 'Ethiopian Airlines', domain: 'ethiopianairlines.com', region: 'Africa', country: 'Ethiopia' },
  'KQ': { code: 'KQ', name: 'Kenya Airways', fullName: 'Kenya Airways', domain: 'kenya-airways.com', region: 'Africa', country: 'Kenya' },
  'MS': { code: 'MS', name: 'EgyptAir', fullName: 'EgyptAir', domain: 'egyptair.com', region: 'Africa', country: 'Egypt' },
  
  // Low-Cost Carriers
  'FR': { code: 'FR', name: 'Ryanair', fullName: 'Ryanair', domain: 'ryanair.com', region: 'Europe', country: 'Ireland' },
  'U2': { code: 'U2', name: 'easyJet', fullName: 'easyJet', domain: 'easyjet.com', region: 'Europe', country: 'United Kingdom' },
  'VY': { code: 'VY', name: 'Vueling', fullName: 'Vueling Airlines', domain: 'vueling.com', region: 'Europe', country: 'Spain' },
  'W6': { code: 'W6', name: 'Wizz Air', fullName: 'Wizz Air', domain: 'wizzair.com', region: 'Europe', country: 'Hungary' },
  'NK': { code: 'NK', name: 'Spirit Airlines', fullName: 'Spirit Airlines', domain: 'spirit.com', region: 'North America', country: 'USA' },
  'F9': { code: 'F9', name: 'Frontier', fullName: 'Frontier Airlines', domain: 'flyfrontier.com', region: 'North America', country: 'USA' },
  'AK': { code: 'AK', name: 'AirAsia', fullName: 'AirAsia', domain: 'airasia.com', region: 'Asia', country: 'Malaysia' },
};

/**
 * Get airline information by IATA code
 */
export function getAirlineInfo(iataCode: string): AirlineInfo | null {
  const code = iataCode.toUpperCase().trim();
  return airlineMapping[code] || null;
}

/**
 * Get airline name by IATA code
 */
export function getAirlineName(iataCode: string): string {
  const info = getAirlineInfo(iataCode);
  return info ? info.name : iataCode;
}

/**
 * Get airline domain by IATA code
 */
export function getAirlineDomain(iataCode: string): string {
  const info = getAirlineInfo(iataCode);
  return info ? info.domain : `airline-${iataCode.toLowerCase()}.com`;
}

/**
 * Get airline full name by IATA code
 */
export function getAirlineFullName(iataCode: string): string {
  const info = getAirlineInfo(iataCode);
  return info ? info.fullName : iataCode;
}

/**
 * Search airlines by name (fuzzy search)
 */
export function searchAirlinesByName(query: string): AirlineInfo[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(airlineMapping).filter(airline => 
    airline.name.toLowerCase().includes(lowerQuery) ||
    airline.fullName.toLowerCase().includes(lowerQuery) ||
    airline.code.toLowerCase() === lowerQuery
  );
}

/**
 * Get airlines by region
 */
export function getAirlinesByRegion(region: string): AirlineInfo[] {
  return Object.values(airlineMapping).filter(airline => 
    airline.region.toLowerCase() === region.toLowerCase()
  );
}

/**
 * Get airlines by country
 */
export function getAirlinesByCountry(country: string): AirlineInfo[] {
  return Object.values(airlineMapping).filter(airline => 
    airline.country.toLowerCase() === country.toLowerCase()
  );
}

export default {
  airlineMapping,
  getAirlineInfo,
  getAirlineName,
  getAirlineDomain,
  getAirlineFullName,
  searchAirlinesByName,
  getAirlinesByRegion,
  getAirlinesByCountry
};
