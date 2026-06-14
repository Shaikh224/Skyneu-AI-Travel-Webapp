/**
 * Smart airport time conversion utility
 * Converts UTC times to airport local times
 */

export function smartAirportTimeConversion(
  utcTime: string | number | Date,
  airportCode: string,
  format: 'time' | 'date' | 'datetime' = 'time'
): string {
  try {
    let date: Date;
    
    if (typeof utcTime === 'string') {
      date = new Date(utcTime);
    } else if (typeof utcTime === 'number') {
      date = new Date(utcTime * 1000);
    } else {
      date = utcTime;
    }
    
    if (isNaN(date.getTime())) {
      return '--:--';
    }
    
    // Get airport timezone (simplified - you can enhance this with a proper timezone database)
    const airportTimezone = getAirportTimezone(airportCode);
    
    if (format === 'time') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: airportTimezone
      });
    } else if (format === 'date') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: airportTimezone
      });
    } else {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: airportTimezone
      });
    }
  } catch (error) {
    console.warn('Error converting time:', error);
    return '--:--';
  }
}

/**
 * Get timezone for airport code
 * This is a simplified mapping - you can enhance this with a proper database
 */
function getAirportTimezone(airportCode: string): string {
  const timezoneMap: Record<string, string> = {
    'DEL': 'Asia/Kolkata',
    'BOM': 'Asia/Kolkata',
    'BLR': 'Asia/Kolkata',
    'MAA': 'Asia/Kolkata',
    'CCU': 'Asia/Kolkata',
    'HYD': 'Asia/Kolkata',
    'PNQ': 'Asia/Kolkata',
    'LKO': 'Asia/Kolkata',
    'JFK': 'America/New_York',
    'LAX': 'America/Los_Angeles',
    'ORD': 'America/Chicago',
    'DFW': 'America/Chicago',
    'ATL': 'America/New_York',
    'LHR': 'Europe/London',
    'CDG': 'Europe/Paris',
    'FRA': 'Europe/Berlin',
    'AMS': 'Europe/Amsterdam',
    'DXB': 'Asia/Dubai',
    'HKG': 'Asia/Hong_Kong',
    'SIN': 'Asia/Singapore',
    'NRT': 'Asia/Tokyo',
    'SYD': 'Australia/Sydney'
  };
  
  return timezoneMap[airportCode] || 'UTC';
}
