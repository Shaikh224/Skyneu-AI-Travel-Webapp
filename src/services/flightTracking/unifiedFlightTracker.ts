import fr24Service from './fr24Service';
import aviationstackService from './aviationstackService';
import airportService from '../airportService';

// Types
export interface FlightSearchParams {
  flightNumber?: string;
  airline?: string;
  route?: {
    from?: string;
    to?: string;
  };
  date?: Date;
  type?: 'live' | 'historical' | 'future';
}

export interface UnifiedFlightData {
  id?: string;
  flightNumber: string;
  flight: {
    number: string;
    iataNumber: string;
    icaoNumber: string;
  };
  airline: {
    name: string;
    iataCode: string;
    icaoCode: string;
  };
  schedule: {
    departure: {
      airport?: string;
      airportName?: string;
      airportCity?: string;
      airportCountry?: string;
      scheduledTime?: string;
      actualTime?: string;
      estimatedTime?: string;
      gate?: string;
      terminal?: string;
      runway?: string;
      delay?: number;
    };
    arrival: {
      airport?: string;
      airportName?: string;
      airportCity?: string;
      airportCountry?: string;
      scheduledTime?: string;
      actualTime?: string;
      estimatedTime?: string;
      gate?: string;
      terminal?: string;
      runway?: string;
      delay?: number;
      baggage?: string;
    };
  };
  status: string;
  aircraft?: {
    registration?: string;
    type?: string;
    manufacturer?: string;
    model?: string;
    year?: number;
    hex?: string;
  };
  live?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    status?: string;
  };
  position?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  };
  events?: Array<{
    time: string;
    type: string;
    description: string;
    location?: string;
    lat?: number;
    lon?: number;
    details?: any;
  }>;
  tracks?: Array<{
    timestamp: string;
    lat: number;
    lon: number;
    alt?: number;
    speed?: number;
    heading?: number;
  }>;
  isFutureFlight?: boolean;
  isLive?: boolean;
  logoUrl?: string;
  photoUrl?: string;
  codeshare?: {
    airline: {
      name: string;
      iata: string;
      icao: string;
    };
    flight: {
      iataNumber: string;
      icaoNumber: string;
      number: string;
    };
  } | null;
  dataQuality: {
    source: string;
    confidence: number;
    hasLiveData: boolean;
    hasScheduleData: boolean;
    hasAircraftData: boolean;
  };
}

class UnifiedFlightTracker {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private airportInfoCache: Map<string, any> = new Map()
  private readonly AIRPORT_CACHE_DURATION = 60 * 60 * 1000 // 1 hour for airport info

  /**
   * Helper function to parse flight number into airline code and flight number
   */
  private parseFlightNumber(flightNumber: string): { airlineCode: string | null; flightNum: string } {
    // Try 2-character codes first (most common)
    // Pattern: 2 letters (AA, SV, 6E, etc.)
    let airlineMatch = flightNumber.match(/^([A-Z]{2}|[0-9][A-Z]|[A-Z][0-9])/i);
    
    // If no 2-char match, try 3-character codes
    if (!airlineMatch) {
      airlineMatch = flightNumber.match(/^([A-Z]{3})/i);
    }
    
    const airlineCode = airlineMatch?.[1]?.toUpperCase() || null;
    const flightNum = airlineCode ? flightNumber.slice(airlineCode.length) : flightNumber;
    
    return { airlineCode, flightNum };
  }

  /**
   * Main method to track a flight with unified data from multiple sources
   */
     async trackFlight(params: FlightSearchParams): Promise<UnifiedFlightData | null> {
     // Temporarily disable cache to debug logo URL issue
     // const cacheKey = JSON.stringify(params);
     // const cached = this.cache.get(cacheKey);
     
     // if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
     //   console.log('📋 Returning cached flight data');
     //   return cached.data;
     // }

    

    // Determine tracking type based on date
    const trackingType = this.determineTrackingType(params);
    

    let result: UnifiedFlightData | null = null;

    try {
      
      switch (trackingType) {
        case 'live':
          result = await this.trackLiveFlight(params);
          break;
        case 'historical':
          result = await this.trackHistoricalFlight(params);
          break;
        case 'future':
          result = await this.trackFutureFlight(params);
          break;
        case 'date-specific':
          result = await this.trackDateSpecificFlight(params);
          break;
        default:
          
          result = await this.trackLiveFlight(params);
      }
      

             if (result) {
         // Temporarily disable cache to debug logo URL issue
         // this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
         
       } else {
         
       }

      return result;
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Determine tracking type based on date and current time
   */
  private determineTrackingType(params: FlightSearchParams): 'live' | 'historical' | 'future' | 'date-specific' {
    if (params.type) {
      return params.type as any;
    }

    if (!params.date) {
      return 'live';
    }

    const now = new Date();
    const targetDate = params.date;
    
    // Use UTC dates for comparison to avoid timezone issues
    const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const targetDateUTC = new Date(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
    
    // Calculate days difference
    const daysDiff = Math.ceil((targetDateUTC.getTime() - nowUTC.getTime()) / (1000 * 60 * 60 * 24));
    
    
    
    if (targetDateUTC.getTime() === nowUTC.getTime()) {
      return 'live';
    } else if (targetDateUTC < nowUTC) {
      return 'historical';
    } else if (daysDiff >= 1 && daysDiff <= 7) {
      // Flights within 1-7 days: use date-specific timetable search
      
      return 'date-specific';
    } else {
      // Flights > 7 days: use future schedules API
      
      return 'future';
    }
  }

  /**
   * Track live flight with real-time data
   */
  private async trackLiveFlight(params: FlightSearchParams): Promise<UnifiedFlightData | null> {
    const searchTerm = params.flightNumber || params.airline;
    if (!searchTerm) return null;

    

    try {
      // Get FR24 data for live tracking
      const fr24Data = await fr24Service.getComprehensiveFlightInfo(searchTerm, params.date);
      
      if (fr24Data.live || fr24Data.summary) {
        
        
        // Extract airport codes from FR24 data for Aviationstack lookup
        const departureAirport = fr24Data.summary?.orig_iata || params.route?.from;
        const arrivalAirport = fr24Data.summary?.dest_iata || params.route?.to;
        
        // Get additional schedule data from Aviationstack with enhanced gate lookup
        // For live flights, use today's date to get current schedule and aircraft info
        const aviationstackData = await aviationstackService.getComprehensiveFlightInfo(searchTerm, departureAirport, arrivalAirport);
        
        // If no gate info from comprehensive lookup, try direct timetable search
        if (!aviationstackData.schedule || (!aviationstackData.schedule.departure?.gate && !aviationstackData.schedule.arrival?.gate)) {
          
          
          // Try both departure and arrival timetables for gate info
          const timetablePromises = [];
          
          if (departureAirport) {
            timetablePromises.push(
              aviationstackService.getFlightSchedule(searchTerm, departureAirport, 'departure')
            );
          }
          
          if (arrivalAirport) {
            timetablePromises.push(
              aviationstackService.getFlightSchedule(searchTerm, arrivalAirport, 'arrival')
            );
          }
          
          const timetableResults = await Promise.all(timetablePromises);
          
          // Merge gate info from timetable results
          for (const schedule of timetableResults) {
            if (schedule) {
              // gate/terminal info will be merged below if present
              
              // Merge the schedule data
              if (!aviationstackData.schedule) {
                aviationstackData.schedule = schedule;
              } else {
                // Merge gate/terminal info
                if (schedule.departure?.gate && !aviationstackData.schedule.departure?.gate) {
                  aviationstackData.schedule.departure = {
                    ...aviationstackData.schedule.departure,
                    gate: schedule.departure.gate,
                    terminal: schedule.departure.terminal
                  };
                }
                if (schedule.arrival?.gate && !aviationstackData.schedule.arrival?.gate) {
                  aviationstackData.schedule.arrival = {
                    ...aviationstackData.schedule.arrival,
                    gate: schedule.arrival.gate,
                    terminal: schedule.arrival.terminal,
                    baggage: schedule.arrival.baggage
                  };
                }
              }
            }
          }
        }
        
        return this.combineFlightData(searchTerm, fr24Data, aviationstackData);
      }

      // Fallback: Check current schedules with enhanced gate lookup
      if (params.route?.from && params.route?.to) {
        const [depSchedules, arrSchedules] = await Promise.all([
          aviationstackService.getTimetable({ iataCode: params.route.from, type: 'departure' }),
          aviationstackService.getTimetable({ iataCode: params.route.to, type: 'arrival' })
        ]);
        
        const foundFlight = [...depSchedules, ...arrSchedules].find(s => 
          s.flight?.iataNumber?.toUpperCase() === searchTerm.toUpperCase()
        );
        
        if (foundFlight) {
          return await this.convertScheduleToUnified(foundFlight, params.date);
        } else {
          // Not found in current schedules
        }
      }

    } catch (error) {
      // Swallow errors to avoid noisy logs
    }

    return null;
  }

  /**
   * Track historical flight using schedule data
   */
  private async trackHistoricalFlight(params: FlightSearchParams): Promise<UnifiedFlightData | null> {
    const searchTerm = params.flightNumber || params.airline;
    if (!searchTerm) return null;

    

    try {
      // Use Aviationstack historical data
      if (params.route?.from && params.date) {
        const historicalSchedule = await aviationstackService.getHistoricalFlightByNumber(
          searchTerm,
          params.date,
          params.route.from, 
          params.route.to
        );
        
        if (historicalSchedule) {
            
          return await this.convertScheduleToUnified(historicalSchedule, params.date);
          }
      }
    } catch (error) {
      // ignore
    }

    return null;
  }

  /**
   * Track future flight with route-based search using Aviationstack Future Schedules API
   */
  private async trackFutureFlight(params: FlightSearchParams): Promise<UnifiedFlightData | null> {
    const searchTerm = params.flightNumber || params.airline;
    if (!searchTerm || !params.date) return null;

    

    const now = new Date();
    const targetDate = params.date;
    const daysDiff = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    

    // This method should only handle flights >7 days ahead
    if (daysDiff <= 7) {
      
      return null;
    }

    // Use Future Schedules API directly (no fabrication needed for >7 days flights)
    if (!params.route?.from) {
      return null;
    }

    
    
    try {
      const futureScheduleData = await aviationstackService.getFutureFlightByNumber(
        searchTerm,
        targetDate,
        params.route.from,
        params.route.to
      );

      if (futureScheduleData) {
        // Convert directly to unified format (no fabrication needed)
        const unifiedData = await this.convertScheduleToUnified(futureScheduleData, targetDate);
        
        // Mark as future flight
        unifiedData.isLive = false;
        unifiedData.isFutureFlight = true;
        unifiedData.status = 'scheduled';
        
        return unifiedData;
      }
    } catch (error) {
      // ignore
    }

    return null;
  }



  /**
   * Track date-specific flight (1-7 days in future) using timetable search
   */
  private async trackDateSpecificFlight(params: FlightSearchParams): Promise<UnifiedFlightData | null> {
    const searchTerm = params.flightNumber || params.airline;
    if (!searchTerm || !params.date) return null;

    

    // First, try to get route information from FR24 (without live data)
    let departureAirport = params.route?.from;
    let arrivalAirport = params.route?.to;

    // If route is not provided, try to get it from FR24 summary data
    if (!departureAirport || !arrivalAirport) {
      try {
        const fr24Data = await fr24Service.getComprehensiveFlightInfo(searchTerm);
        if (fr24Data.summary) {
          departureAirport = departureAirport || fr24Data.summary.orig_iata;
          arrivalAirport = arrivalAirport || fr24Data.summary.dest_iata;
        }
      } catch (error) {
        // ignore
      }
    }

    if (!departureAirport || !arrivalAirport) {
      return null;
    }

    // Simple approach: Add 7 days to user date and get future schedule
    try {
      // Add 7 days to user's date to make it work with Future Schedules API
      const futureDate = new Date(params.date);
      futureDate.setDate(futureDate.getDate() + 7);
      
      const futureScheduleData = await aviationstackService.getFutureFlightByNumber(
        searchTerm,
        futureDate,
        departureAirport,
        arrivalAirport
      );

      if (futureScheduleData) {
        
        // Use the schedule data directly (it's a single object, not an array)
        const schedulePattern = futureScheduleData;
        
        // Fabricate the flight data for user's original date
        const fabricatedFlight = this.fabricateFlightForDate(schedulePattern, params.date);
        return await this.processFutureFlightData(fabricatedFlight, params.date);
        
      } else {
        return null;
      }
      
    } catch (error) {
      // ignore
      return null;
    }
  }

  /**
   * Fabricate flight data for a specific date based on a pattern flight
   */
  private fabricateFlightForDate(patternFlight: any, targetDate: Date): any {
    try {
      // Validate input parameters
      if (!targetDate || isNaN(targetDate.getTime())) {
        throw new Error('Invalid target date for flight fabrication');
      }
      
      if (!patternFlight) {
        throw new Error('No pattern flight data provided');
      }
      
      // Get the original flight times with validation
      const originalDepTime = patternFlight.departure?.scheduledTime;
      const originalArrTime = patternFlight.arrival?.scheduledTime;
      
      if (!originalDepTime && !originalArrTime) {
        return patternFlight;
      }

      // Calculate the time of day from the pattern flight with validation
      const getTimeOfDay = (timeStr: string) => {
        if (!timeStr) return null;
        
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return null;
        
        return {
          hours: date.getUTCHours(),
          minutes: date.getUTCMinutes(),
          seconds: date.getUTCSeconds()
        };
      };

      const fabricatedFlight = JSON.parse(JSON.stringify(patternFlight)); // Deep clone

      // Fabricate departure time with validation
      if (originalDepTime) {
        const depTimeOfDay = getTimeOfDay(originalDepTime);
        
        if (!depTimeOfDay) {
          throw new Error('Invalid departure time in pattern flight');
        }
        
        const fabricatedDepDate = new Date(targetDate);
        if (isNaN(fabricatedDepDate.getTime())) throw new Error('Invalid target date for departure fabrication');
        
        fabricatedDepDate.setUTCHours(depTimeOfDay.hours, depTimeOfDay.minutes, depTimeOfDay.seconds, 0);
        
        if (isNaN(fabricatedDepDate.getTime())) {
          console.error('❌ Fabricated departure date is invalid after setting hours:', {
            targetDate: targetDate.toISOString(),
            hours: depTimeOfDay.hours,
            minutes: depTimeOfDay.minutes,
            seconds: depTimeOfDay.seconds
          });
          throw new Error('Invalid fabricated departure date');
        }
        
        fabricatedFlight.departure.scheduledTime = fabricatedDepDate.toISOString();
        console.log(`🕐 Fabricated departure: ${fabricatedDepDate.toISOString()}`);
      }

      // Fabricate arrival time with validation
      if (originalArrTime) {
        console.log('🔧 Processing arrival time:', originalArrTime);
        const arrTimeOfDay = getTimeOfDay(originalArrTime);
        
        if (!arrTimeOfDay) {
          console.error('❌ Could not extract time of day from arrival time:', originalArrTime);
          throw new Error('Invalid arrival time in pattern flight');
        }
        
        const fabricatedArrDate = new Date(targetDate);
        if (isNaN(fabricatedArrDate.getTime())) {
          console.error('❌ Could not create fabricated arrival date from target date:', targetDate);
          throw new Error('Invalid target date for arrival fabrication');
        }
        
        fabricatedArrDate.setUTCHours(arrTimeOfDay.hours, arrTimeOfDay.minutes, arrTimeOfDay.seconds, 0);
        
        if (isNaN(fabricatedArrDate.getTime())) {
          console.error('❌ Fabricated arrival date is invalid after setting hours:', {
            targetDate: targetDate.toISOString(),
            hours: arrTimeOfDay.hours,
            minutes: arrTimeOfDay.minutes,
            seconds: arrTimeOfDay.seconds
          });
          throw new Error('Invalid fabricated arrival date');
        }
        
        // Handle overnight flights (arrival next day) with validation
        if (originalDepTime) {
          const originalDepDate = new Date(originalDepTime);
          const originalArrDate = new Date(originalArrTime);
          
          if (!isNaN(originalDepDate.getTime()) && !isNaN(originalArrDate.getTime())) {
            if (originalArrDate.getDate() !== originalDepDate.getDate()) {
              fabricatedArrDate.setDate(fabricatedArrDate.getDate() + 1);
              console.log('✈️ Detected overnight flight, arrival date adjusted');
              
              if (isNaN(fabricatedArrDate.getTime())) {
                console.error('❌ Fabricated arrival date became invalid after overnight adjustment');
                throw new Error('Invalid fabricated arrival date after overnight adjustment');
              }
            }
          }
        }
        
        fabricatedFlight.arrival.scheduledTime = fabricatedArrDate.toISOString();
        console.log(`🕐 Fabricated arrival: ${fabricatedArrDate.toISOString()}`);
      }

    // Clean all actual/estimated data since this is a future scheduled flight
    if (fabricatedFlight.departure) {
      // Keep only scheduled time and static info
      const cleanDeparture = {
        iataCode: fabricatedFlight.departure.iataCode,
        icaoCode: fabricatedFlight.departure.icaoCode,
        scheduledTime: fabricatedFlight.departure.scheduledTime,
        gate: fabricatedFlight.departure.gate,
        terminal: fabricatedFlight.departure.terminal,
        // Remove all actual/estimated/delay data
        actualTime: null,
        estimatedTime: null,
        actualRunway: null,
        estimatedRunway: null,
        delay: null
      };
      fabricatedFlight.departure = cleanDeparture;
    }
    
    if (fabricatedFlight.arrival) {
      // Keep only scheduled time and static info
      const cleanArrival = {
        iataCode: fabricatedFlight.arrival.iataCode,
        icaoCode: fabricatedFlight.arrival.icaoCode,
        scheduledTime: fabricatedFlight.arrival.scheduledTime,
        gate: fabricatedFlight.arrival.gate,
        terminal: fabricatedFlight.arrival.terminal,
        baggage: fabricatedFlight.arrival.baggage,
        // Remove all actual/estimated/delay data
        actualTime: null,
        estimatedTime: null,
        actualRunway: null,
        estimatedRunway: null,
        delay: null
      };
      fabricatedFlight.arrival = cleanArrival;
    }

    // Force scheduled status and remove any status-related fields
    fabricatedFlight.status = 'scheduled';
    
    // Remove any other fields that might indicate actual flight data
    delete fabricatedFlight.actualDepartureTime;
    delete fabricatedFlight.actualArrivalTime;
    delete fabricatedFlight.estimatedDepartureTime;
    delete fabricatedFlight.estimatedArrivalTime;

      console.log('✅ Flight data fabrication completed');
      return fabricatedFlight;
      
    } catch (error) {
      console.error('❌ Error in flight data fabrication:', error);
      console.error('🔍 Fabrication context:', {
        targetDate: targetDate?.toISOString?.(),
        patternFlight: patternFlight ? 'provided' : 'missing',
        originalDepTime: patternFlight?.departure?.scheduledTime,
        originalArrTime: patternFlight?.arrival?.scheduledTime
      });
      
      // Return the original pattern flight if fabrication fails
      console.log('🔄 Returning original pattern flight due to fabrication error');
      return patternFlight;
    }
  }

  /**
   * Process future flight data with proper status and metadata
   */
  private async processFutureFlightData(scheduleData: any, searchDate: Date): Promise<UnifiedFlightData> {
    // Convert to unified format
    const unifiedData = await this.convertScheduleToUnified(scheduleData, searchDate);
    
    // Mark as future flight and force appropriate status
    unifiedData.isLive = false;
    unifiedData.isFutureFlight = true;
    
    // Verify this is actually a future date and force status accordingly
    const now = new Date();
    const isFutureDate = searchDate > now;
    
    const originalStatus = unifiedData.status;
    
    if (isFutureDate) {
      // Force status to 'scheduled' for all date-specific future flights
      unifiedData.status = 'scheduled';
      console.log(`✅ Date-specific FUTURE flight processing completed: ${originalStatus} → ${unifiedData.status} (for date ${searchDate.toISOString().split('T')[0]})`);
    } else {
      // This shouldn't happen in date-specific tracking, but log it
      console.log(`⚠️ Date-specific tracking called for non-future date: ${searchDate.toISOString().split('T')[0]} (status: ${originalStatus})`);
    }
    
    return unifiedData;
  }



  /**
   * Convert Aviationstack schedule to unified format (legacy method for individual calls)
   */
  private async convertScheduleToUnified(schedule: any, searchDate?: Date): Promise<UnifiedFlightData> {
    const now = new Date();
    
    
    
    // Determine if this is an arrival or departure schedule
    const isArrivalSchedule = schedule.type === 'arrival' || 
                             (schedule.arrival && !schedule.departure) ||
                             (schedule.arrival?.scheduledTime && !schedule.departure?.scheduledTime);
    
    // Create a modified schedule object with type information for proper status determination
    const scheduleWithType = {
      ...schedule,
      type: isArrivalSchedule ? 'arrival' : 'departure'
    };

    // Check if this is a future flight (scheduled time is in the future)
    const scheduledTime = schedule.departure?.scheduledTime || schedule.arrival?.scheduledTime;
    const isFutureFlight = scheduledTime && new Date(scheduledTime) > now;

    // Determine status using schedule-specific logic
    // For date-specific searches, we know this is a future flight, so force appropriate status
    let status: string;
    if (searchDate && searchDate > now) {
      // This is a date-specific future flight search - always treat as scheduled
      status = 'scheduled';
      console.log('🎯 Date-specific future flight - forcing status to "scheduled"');
    } else {
      // For other cases, use the normal status determination
      status = this.determineStatusFromSchedule(scheduleWithType, searchDate);
    }

    // Build aircraft info
    const aircraftInfo = this.buildAircraftInfo(schedule);

    // Build airline info with logo
    const airlineInfo = await this.buildAirlineInfo(schedule);

    // Debug logging for date values
    console.log('🔍 Schedule date values:', {
      departure: {
        scheduledTime: schedule.departure?.scheduledTime,
        actualTime: schedule.departure?.actualTime,
        estimatedTime: schedule.departure?.estimatedTime
      },
      arrival: {
        scheduledTime: schedule.arrival?.scheduledTime,
        actualTime: schedule.arrival?.actualTime,
        estimatedTime: schedule.arrival?.estimatedTime
      }
    });

    // Helper function to normalize date strings
    const normalizeDate = (dateStr: string | undefined): string | undefined => {
      if (!dateStr) return undefined;
      
      try {
        // Check if it's just a time string (HH:MM format)
        if (/^\d{1,2}:\d{2}$/.test(dateStr)) {
          // This is a time-only string, construct full date using the search date
          const targetDate = searchDate || new Date();
          const [hours, minutes] = dateStr.split(':').map(Number);
          
          // Create a new date with the target date and the time
          const fullDate = new Date(targetDate);
          fullDate.setHours(hours, minutes, 0, 0);
          
          console.log(`🕐 Constructed full date from time ${dateStr} on ${targetDate.toISOString().split('T')[0]}: ${fullDate.toISOString()}`);
          return fullDate.toISOString();
        }
        
        // Try to parse as a full date string
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn('⚠️ Invalid date string from API:', dateStr);
          return undefined;
        }
        return date.toISOString();
      } catch (error) {
        console.warn('⚠️ Error parsing date string:', error);
        return undefined;
      }
    };

         // Fetch airport information for departure and arrival
     const [departureAirportInfo, arrivalAirportInfo] = await Promise.all([
       this.getAirportInfo(schedule.departure?.iataCode),
       this.getAirportInfo(schedule.arrival?.iataCode)
     ]);
     
     // Debug logging for airport info
     console.log('🔍 Airport info fetched:', {
       departure: { iataCode: schedule.departure?.iataCode, info: departureAirportInfo },
       arrival: { iataCode: schedule.arrival?.iataCode, info: arrivalAirportInfo }
     });

    // Construct the full flight number from airline code and flight number
    const airlineCode = schedule.airline?.iataCode?.toUpperCase() || '';
    
    // Extract flight number without airline prefix to avoid duplication
    let flightNum = '';
    if (schedule.flight?.number) {
      flightNum = schedule.flight.number;
    } else if (schedule.flight?.iataNumber) {
      // Remove airline code from iataNumber to get just the number part
      const { flightNum: extractedNum } = this.parseFlightNumber(schedule.flight.iataNumber);
      flightNum = extractedNum;
    }
    
    // Construct full flight number, but avoid duplication
    let fullFlightNumber = '';
    if (airlineCode && flightNum) {
      // Check if the flight number already starts with the airline code
      if (flightNum.toUpperCase().startsWith(airlineCode)) {
        fullFlightNumber = flightNum.toUpperCase();
      } else {
        fullFlightNumber = `${airlineCode}${flightNum}`;
      }
    } else {
      fullFlightNumber = schedule.flight?.iataNumber || schedule.flight?.number || '';
    }
    
    console.log(`🔧 Flight number construction: airline=${airlineCode}, flightNum=${flightNum}, full=${fullFlightNumber}`);
    
    return {
      flightNumber: fullFlightNumber.toUpperCase(),
      flight: {
        number: flightNum,
        iataNumber: fullFlightNumber.toUpperCase(),
        icaoNumber: schedule.flight?.icaoCode || ''
      },
      airline: airlineInfo,
      schedule: {
        departure: {
          airport: schedule.departure?.iataCode?.toUpperCase(),
          airportName: departureAirportInfo.name || schedule.departure?.nameAirport || schedule.departure?.nameCity,
          airportCity: departureAirportInfo.city || schedule.departure?.nameCity,
          airportCountry: departureAirportInfo.country || schedule.departure?.nameCountry,
          scheduledTime: normalizeDate(schedule.departure?.scheduledTime),
          // For future flights, only show scheduled time
          actualTime: (searchDate && searchDate > now) ? undefined : normalizeDate(schedule.departure?.actualTime),
          estimatedTime: (searchDate && searchDate > now) ? undefined : normalizeDate(schedule.departure?.estimatedTime),
          gate: schedule.departure?.gate,
          terminal: schedule.departure?.terminal,
          runway: schedule.departure?.runway,
          delay: (searchDate && searchDate > now) ? undefined : schedule.departure?.delay
        },
        arrival: {
          airport: schedule.arrival?.iataCode?.toUpperCase(),
          airportName: arrivalAirportInfo.name || schedule.arrival?.nameAirport || schedule.arrival?.nameCity,
          airportCity: arrivalAirportInfo.city || schedule.arrival?.nameCity,
          airportCountry: arrivalAirportInfo.country || schedule.arrival?.nameCountry,
          scheduledTime: normalizeDate(schedule.arrival?.scheduledTime),
          // For future flights, only show scheduled time
          actualTime: (searchDate && searchDate > now) ? undefined : normalizeDate(schedule.arrival?.actualTime),
          estimatedTime: (searchDate && searchDate > now) ? undefined : normalizeDate(schedule.arrival?.estimatedTime),
          gate: schedule.arrival?.gate,
          terminal: schedule.arrival?.terminal,
          runway: schedule.arrival?.runway,
          delay: (searchDate && searchDate > now) ? undefined : schedule.arrival?.delay,
          baggage: schedule.arrival?.baggage
        }
      },
      status,
      aircraft: aircraftInfo,
      isFutureFlight,
      isLive: false, // Schedule data is not live
      position: undefined, // No live position for schedule data
      logoUrl: airlineInfo.logoUrl,
      photoUrl: aircraftInfo.photoUrl,
      events: [], // No events for schedule data
      dataQuality: {
        source: 'Aviationstack',
        confidence: 0.8,
        hasLiveData: false,
        hasScheduleData: true,
        hasAircraftData: !!(aircraftInfo.registration || aircraftInfo.type)
      }
    };
  }

  /**
   * Determine flight status from schedule data
   */
  private determineStatusFromSchedule(schedule: any, searchDate?: Date): string {
    const now = new Date();
    const isArrival = schedule.type === 'arrival';
    
    // First, check if API provides a status and use it if it's meaningful
    if (schedule.status && schedule.status !== 'unknown' && schedule.status !== 'active') {
      const apiStatus = schedule.status.toLowerCase();
      // Map some common API statuses
      if (apiStatus === 'landed') return 'arrived';
      if (apiStatus === 'scheduled') return 'scheduled';
      if (apiStatus === 'cancelled') return 'cancelled';
      if (apiStatus === 'delayed') return 'delayed';
      if (apiStatus === 'diverted') return 'diverted';
      if (apiStatus === 'incident') return 'delayed';
      if (apiStatus === 'redirected') return 'diverted';
    }
    
    // Use appropriate scheduled time based on schedule type
    const scheduledTimeStr = isArrival ? 
      schedule.arrival?.scheduledTime : 
      schedule.departure?.scheduledTime;
    
    const actualTimeStr = isArrival ? 
      schedule.arrival?.actualTime : 
      schedule.departure?.actualTime;
    
    const estimatedTimeStr = isArrival ? 
      schedule.arrival?.estimatedTime : 
      schedule.departure?.estimatedTime;

    if (!scheduledTimeStr) return 'unknown';

    // For future flights, construct the full date using search date and time
    let scheduledTime: Date;
    if (searchDate && /^\d{1,2}:\d{2}$/.test(scheduledTimeStr)) {
      // This is a time-only string, construct full date using search date
      const [hours, minutes] = scheduledTimeStr.split(':').map(Number);
      scheduledTime = new Date(searchDate);
      scheduledTime.setHours(hours, minutes, 0, 0);
    } else {
      scheduledTime = new Date(scheduledTimeStr);
    }

    const actualTime = actualTimeStr ? new Date(actualTimeStr) : null;
    const estimatedTime = estimatedTimeStr ? new Date(estimatedTimeStr) : null;

    // Check if flight is in the future
    if (scheduledTime > now) {
      const hoursUntil = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Check for delays in future flights
      const scheduleDelay = schedule.departure?.delay || schedule.arrival?.delay;
      if (scheduleDelay && scheduleDelay > 15) {
        return 'delayed';
      }
      
      if (isArrival) {
        // For arrivals in the future, show different statuses based on proximity
        if (hoursUntil <= 0.5) {
          return 'approaching';
        } else if (hoursUntil <= 1.5) {
          return 'descending';
        } else if (hoursUntil <= 4) {
          return 'en-route';
        } else {
          return 'scheduled';
        }
      } else {
        // For departures in the future
        const minutesUntil = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
        
        // Use estimated time if available, otherwise use scheduled time
        const departureTime = estimatedTime || scheduledTime;
        const minutesUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60);
        
        if (minutesUntilDeparture <= 25) {
          return 'gate-closed';
        } else if (minutesUntil <= 45) {
          return 'boarding';
        } else if (minutesUntil <= 90) {
          return 'check-in';
        } else {
          return 'scheduled';
        }
      }
    }

    // For past/current flights
    if (actualTime) {
      return isArrival ? 'arrived' : 'departed';
    }

    // Handle flights that are past scheduled time but haven't arrived/departed yet
    const hoursOverdue = (now.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);
    
    if (isArrival) {
      // For arrivals that are overdue
      if (estimatedTime && estimatedTime > now) {
        // Has estimated time in the future - still en-route but delayed
        const hoursUntilEstimated = (estimatedTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilEstimated <= 0.5) {
          return 'approaching';
        } else {
          return 'delayed';
        }
      } else if (hoursOverdue <= 2) {
        // Recently overdue - might still be approaching
        return 'delayed';
      } else {
        // Long overdue without actual arrival - might be diverted or cancelled
        return 'unknown';
      }
    } else {
      // For departures
      if (estimatedTime) {
        const delay = (estimatedTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        if (delay > 15) {
          return 'delayed';
        }
      }
      
      // Check if there's a delay field in the schedule data
      const scheduleDelay = schedule.departure?.delay || schedule.arrival?.delay;
      if (scheduleDelay && scheduleDelay > 15) {
        return 'delayed';
      }
      
      if (hoursOverdue <= 1) {
        return 'delayed';
      } else {
        return 'departed'; // Assume departed if long overdue without actual time
      }
    }

    // This should rarely be reached
    return isArrival ? 'scheduled' : 'scheduled';
  }

  /**
   * Build aircraft information from schedule data
   */
  private buildAircraftInfo(schedule: any): any {
    const aircraft = schedule.aircraft || {};
    
    return {
      registration: aircraft.regNumber || aircraft.registration,
      type: this.mapAircraftType(aircraft.modelCode || aircraft.type),
      manufacturer: this.extractManufacturerFromType(aircraft.modelCode || aircraft.type),
      model: aircraft.modelText || aircraft.model,
      hex: aircraft.hex
    };
  }

  /**
   * Calculate estimated time based on scheduled time and delay
   */
  private calculateEstimatedTime(scheduledTime: string | undefined, delay: number | undefined): string | undefined {
    if (!scheduledTime || delay === undefined || delay === null || delay === 0) {
      return undefined;
    }
    
    try {
      const scheduled = new Date(scheduledTime);
      if (isNaN(scheduled.getTime())) {
        return undefined;
      }
      
      // Add delay in minutes to scheduled time
      const estimated = new Date(scheduled.getTime() + (delay * 60 * 1000));
      return estimated.toISOString();
    } catch (error) {
      console.warn('Error calculating estimated time:', error);
      return undefined;
    }
  }

  /**
   * Generate aircraft photo API URL from Planespotters.net
   */
  private generateAircraftPhotoUrl(registration: string): string | undefined {
    if (!registration) return undefined;
    
    // Use the official Planespotters.net API endpoint
    // Clean registration (remove hyphens, spaces, keep uppercase for API)
    const cleanReg = registration.replace(/[-\s]/g, '').toUpperCase();
    
    // Return the API endpoint - we'll fetch and parse the JSON response in the UI
    return `https://api.planespotters.net/pub/photos/reg/${cleanReg}`;
  }

  /**
   * Build airline information with logo
   */
  private async buildAirlineInfo(schedule: any): Promise<any> {
    const airline = schedule.airline || {};
    let iataCode = airline.iataCode || '';
    
    console.log(`🔍 buildAirlineInfo called with schedule:`, {
      'airline.iataCode': airline.iataCode,
      'airline.name': airline.name,
      'airline.nameAirline': airline.nameAirline,
      'flight.iataNumber': schedule.flight?.iataNumber,
      'full airline object': airline
    });
    
    // If we have a flight number but the airline code looks wrong, try to re-parse it
    if (schedule.flight?.iataNumber && (!iataCode || iataCode.length > 2)) {
      const { airlineCode } = this.parseFlightNumber(schedule.flight.iataNumber);
      if (airlineCode && airlineCode.length <= 3) {
        console.log(`🔧 Corrected airline code from ${airline.iataCode} to ${airlineCode} based on flight number ${schedule.flight.iataNumber}`);
        iataCode = airlineCode;
      }
    }
    
    // Ensure we have a valid IATA code
    if (!iataCode && schedule.flight?.iataNumber) {
      const { airlineCode } = this.parseFlightNumber(schedule.flight.iataNumber);
      if (airlineCode) {
        iataCode = airlineCode;
      }
    }
    
    // Load airlines data to get proper airline name
    let airlineName = airline.name || airline.nameAirline || '';
    let icaoCode = airline.icaoCode || airline.codeIcaoAirline || '';
    
    // If we don't have a proper airline name, try to get it from AviationStack API
    if (!airlineName && iataCode) {
      try {
        console.log(`🔍 Fetching airline info for ${iataCode} from AviationStack API`);
        console.log(`🔍 Current airlineName before API call: "${airlineName}"`);
        const airlineInfo = await aviationstackService.getAirlineInfo(iataCode);
        console.log(`🔍 AviationStack API response:`, airlineInfo);
        if (airlineInfo) {
          console.log(`🔍 airlineInfo.airline_name: "${airlineInfo.airline_name}"`);
          airlineName = airlineInfo.airline_name || airlineName;
          icaoCode = airlineInfo.icao_code || icaoCode;
          console.log(`🔧 Found airline name from AviationStack: ${airlineName} for code ${iataCode}`);
        } else {
          // Fallback to static airlines data
          try {
            const airlinesData = require('../../data/airlines.json');
            const staticAirlineInfo = airlinesData.airlines[iataCode.toUpperCase()];
            if (staticAirlineInfo) {
              airlineName = staticAirlineInfo.name;
              icaoCode = staticAirlineInfo.icao || icaoCode;
              console.log(`🔧 Found airline name from static data: ${airlineName} for code ${iataCode}`);
            }
          } catch (error) {
            console.warn('Failed to load static airlines data:', error);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch airline data from AviationStack:', error);
        // Fallback to static airlines data
        try {
          const airlinesData = require('../../data/airlines.json');
          const staticAirlineInfo = airlinesData.airlines[iataCode.toUpperCase()];
          if (staticAirlineInfo) {
            airlineName = staticAirlineInfo.name;
            icaoCode = staticAirlineInfo.icao || icaoCode;
            console.log(`🔧 Found airline name from static data (fallback): ${airlineName} for code ${iataCode}`);
          }
        } catch (staticError) {
          console.warn('Failed to load static airlines data:', staticError);
        }
      }
    }
    
    const result = {
      name: airlineName || 'Unknown Airline',
      iataCode: iataCode.toUpperCase(), // Ensure uppercase
      icaoCode: icaoCode,
      logoUrl: iataCode ? `http://img.wway.io/pics/root/${iataCode.toUpperCase()}@png?exar=1&rs=fit:200:200` : undefined
    };
    
    console.log(`🔍 buildAirlineInfo result - name: ${result.name}, iataCode: ${result.iataCode}, logoUrl: ${result.logoUrl}`);
    console.log(`🔍 buildAirlineInfo input fields - airline.name: ${airline.name}, airline.nameAirline: ${airline.nameAirline}`);
    console.log(`🔍 buildAirlineInfo full result object:`, JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Format flight event description
   */
  private formatEventDescription(event: any): string {
    const eventDescriptions: Record<string, string> = {
      'gate_departure': 'Departed from gate',
      'takeoff': 'Took off',
      'cruising': 'Cruising',
      'airspace_transition': 'Entered new airspace',
      'resuming_flightplan': 'Resumed flight plan',
      'descent': 'Started descent',
      'landed': 'Landed',
      'gate_arrival': 'Arrived at gate'
    };

    let description = eventDescriptions[event.type] || event.type;
    
    // Add specific details based on event type
    if (event.details) {
      switch (event.type) {
        case 'takeoff':
          if (event.details.takeoff_runway) {
            description += ` on runway ${event.details.takeoff_runway}`;
          }
          break;
        case 'landed':
          if (event.details.landed_runway) {
            description += ` on runway ${event.details.landed_runway}`;
          }
          break;
        case 'airspace_transition':
          if (event.details.entered_airspace) {
            description += ` (${event.details.entered_airspace})`;
          }
          break;
        case 'gate_departure':
        case 'gate_arrival':
          if (event.details.gate_ident) {
            description += ` ${event.details.gate_ident}`;
          }
          break;
      }
    }

    return description;
  }

  /**
   * Map aircraft type codes to readable format
   */
  private mapAircraftType(typeCode: string): string {
    if (!typeCode) return '';
    
    const typeMap: { [key: string]: string } = {
      // Boeing 737 Family
      'B737': 'Boeing 737',
      'B738': 'Boeing 737-800',
      'B739': 'Boeing 737-900',
      'B37M': 'Boeing 737 MAX',
      'B38M': 'Boeing 737 MAX 8',
      'B39M': 'Boeing 737 MAX 9',
      
      // Boeing 777 Family  
      'B777': 'Boeing 777',
      'B77W': 'Boeing 777-300ER',
      'B77L': 'Boeing 777-200LR',
      
      // Boeing 787 Family
      'B787': 'Boeing 787 Dreamliner',
      'B788': 'Boeing 787-8',
      'B789': 'Boeing 787-9',
      'B78X': 'Boeing 787-10',
      
      // Boeing 747 Family
      'B747': 'Boeing 747',
      'B748': 'Boeing 747-8',
      
      // Boeing 767 Family
      'B767': 'Boeing 767',
      'B763': 'Boeing 767-300',
      
      // Airbus A320 Family
      'A320': 'Airbus A320',
      'A321': 'Airbus A321',
      'A319': 'Airbus A319',
      'A318': 'Airbus A318',
      'A20N': 'Airbus A320neo',
      'A21N': 'Airbus A321neo',
      
      // Airbus A330 Family
      'A330': 'Airbus A330',
      'A332': 'Airbus A330-200',
      'A333': 'Airbus A330-300',
      'A339': 'Airbus A330-900neo',
      
      // Airbus A340 Family
      'A340': 'Airbus A340',
      'A342': 'Airbus A340-200',
      'A343': 'Airbus A340-300',
      
      // Airbus A350 Family
      'A350': 'Airbus A350',
      'A359': 'Airbus A350-900',
      'A35K': 'Airbus A350-1000',
      
      // Airbus A380
      'A380': 'Airbus A380',
      'A388': 'Airbus A380-800',
      
      // Regional Aircraft
      'E190': 'Embraer E190',
      'E195': 'Embraer E195',
      'CRJ9': 'Bombardier CRJ-900',
      'DH8D': 'De Havilland Dash 8-400'
    };
    
    return typeMap[typeCode.toUpperCase()] || typeCode;
  }

  /**
   * Extract manufacturer from aircraft type
   */
  private extractManufacturerFromType(typeCode: string): string {
    if (!typeCode) return '';
    
    const code = typeCode.toUpperCase();
    if (code.startsWith('B') || code.includes('BOEING')) return 'Boeing';
    if (code.startsWith('A') || code.includes('AIRBUS')) return 'Airbus';
    if (code.includes('EMBRAER') || code.startsWith('E')) return 'Embraer';
    if (code.includes('BOMBARDIER') || code.startsWith('CRJ')) return 'Bombardier';
    
    return '';
  }



    /**
   * Get airport information from enhanced airport service with proper name, city, and country
   */
  private async getAirportInfo(iataCode: string): Promise<{
    name?: string;
    city?: string;
    country?: string;
  }> {
    if (!iataCode) return {};
    
    const cacheKey = `airport_${iataCode.toUpperCase()}`;
    const cached = this.airportInfoCache.get(cacheKey);
    
    // Check if cached data is still valid
    if (cached && cached.timestamp && (Date.now() - cached.timestamp) < this.AIRPORT_CACHE_DURATION) {
      return cached.data;
    }
    
    try {
      // Use enhanced airport service for comprehensive airport data
      console.log(`🔍 Fetching airport info for ${iataCode} using enhanced airport service...`);
      const airport = await airportService.getAirportInfo(iataCode.toUpperCase());
      
      let result = {};
      if (airport) {
        result = {
          name: airport.name || '',
          city: airport.city || '',
          country: airport.country || ''
        };
        console.log(`✅ Airport info fetched for ${iataCode}:`, result);
      } else {
        console.log(`❌ No airport info found for ${iataCode}`);
      }
      
      // Cache the result
      this.airportInfoCache.set(cacheKey, { 
        data: result, 
        timestamp: Date.now() 
      });
      
      return result;
    } catch (error) {
      console.warn(`⚠️ Could not fetch airport info for ${iataCode}:`, error);
      return {};
    }
  }


  /**
   * Combine flight data from multiple sources
   */
  private async combineFlightData(
    flightNumber: string,
    fr24Data: any,
    aviationstackData: any
  ): Promise<UnifiedFlightData> {
    console.log('🔄 Combining flight data from multiple sources');

    // Start with FR24 data as base if available
    const { airlineCode, flightNum } = this.parseFlightNumber(flightNumber);
    let unifiedData: UnifiedFlightData = {
      flightNumber: flightNumber,
      flight: {
        number: flightNum,
        iataNumber: flightNumber,
        icaoNumber: flightNumber
      },
      airline: {
        name: '',
        iataCode: airlineCode || '',
        icaoCode: ''
      },
      schedule: {
        departure: {},
        arrival: {}
      },
      status: 'unknown',
      aircraft: {},
      live: {},
      position: undefined, // No live position for basic data
      isLive: false,
      events: [], // No events for basic data
      tracks: [], // Initialize empty tracks array
      dataQuality: {
        source: 'FR24',
        confidence: 0.6,
        hasLiveData: false,
        hasScheduleData: false,
        hasAircraftData: false
      }
    };

         // Extract estimated times from FR24 live positions data (eta field) - declare at function scope
     let fr24EstimatedArrival = undefined;
     let fr24ActualArrival = undefined;
     let actualArrivalFromEvents = null;
     
     if (fr24Data.positions && fr24Data.positions.length > 0) {
       const latestPosition = fr24Data.positions[0]; // Most recent position
       if (latestPosition.eta) {
         fr24EstimatedArrival = latestPosition.eta;
         console.log(`✈️ Found FR24 live position ETA: ${fr24EstimatedArrival}`);
       } else {
         console.log(`⚠️ FR24 live position available but no ETA found. Position data:`, {
           hasEta: !!latestPosition.eta,
           eta: latestPosition.eta,
           timestamp: latestPosition.timestamp,
           source: latestPosition.source
         });
       }
       
       // Check if we have actual arrival time from positions data
       if (latestPosition.actual_arrival) {
         fr24ActualArrival = latestPosition.actual_arrival;
         console.log(`🛬 Found FR24 live position actual arrival: ${fr24ActualArrival}`);
       }
     } else {
       console.log(`ℹ️ No FR24 live positions data available for ETA extraction`);
     }

     // Add FR24 data if available
     if (fr24Data) {
       if (fr24Data.live) {
         unifiedData.live = {
           latitude: fr24Data.live.lat,
           longitude: fr24Data.live.lon,
           altitude: fr24Data.live.alt,
           speed: fr24Data.live.gspeed,
           heading: fr24Data.live.track,
           status: fr24Data.live.status
         };
         unifiedData.position = {
           latitude: fr24Data.live.lat,
           longitude: fr24Data.live.lon,
           altitude: fr24Data.live.alt,
           speed: fr24Data.live.gspeed,
           heading: fr24Data.live.track
         };
         console.log(`🛩️ Live position: ${fr24Data.live.lat}, ${fr24Data.live.lon}, Alt: ${fr24Data.live.alt}ft, Speed: ${fr24Data.live.gspeed}kts, Heading: ${fr24Data.live.track}°`);
         unifiedData.dataQuality.hasLiveData = true;
         unifiedData.dataQuality.confidence += 0.2;
         unifiedData.isLive = true;
       }

       // Add tracks data if available
       if (fr24Data.tracks && Array.isArray(fr24Data.tracks)) {
         unifiedData.tracks = fr24Data.tracks.map((track: any) => ({
           timestamp: track.timestamp,
           lat: track.lat,
          lon: track.lon,
          alt: track.alt,
          speed: track.gspeed,
          heading: track.track
        }));
        console.log(`🛤️ Added ${unifiedData.tracks?.length || 0} track points`);
      }

       // Add events data if available and enhance with Aviationstack gate information
       if (fr24Data.events && Array.isArray(fr24Data.events)) {
         unifiedData.events = fr24Data.events.map((event: any) => {
           const enhancedEvent = { ...event };
           
           // Enhance gate events with Aviationstack gate information if available
           if ((event.type === 'gate_departure' || event.type === 'gate_arrival') && aviationstackData?.schedule) {
             if (event.type === 'gate_departure' && aviationstackData.schedule.departure?.gate) {
               enhancedEvent.details = {
                 ...enhancedEvent.details,
                 gate_ident: aviationstackData.schedule.departure.gate
               };
             } else if (event.type === 'gate_arrival' && aviationstackData.schedule.arrival?.gate) {
               enhancedEvent.details = {
                 ...enhancedEvent.details,
                 gate_ident: aviationstackData.schedule.arrival.gate
               };
             }
           }
           
           return {
             time: event.timestamp,
             type: event.type,
             description: this.formatEventDescription(enhancedEvent),
             location: event.lat && event.lon ? `${event.lat}, ${event.lon}` : undefined, // Keep for map plotting
             lat: event.lat, // Store coordinates separately for map use
             lon: event.lon,
             details: enhancedEvent.details
           };
          });
          console.log(`📋 Added ${unifiedData.events?.length || 0} flight events (enhanced with Aviationstack gate info)`);
        }

       if (fr24Data.summary) {

        // Enhanced FR24 data extraction with all available fields
        unifiedData.schedule.departure = {
          ...unifiedData.schedule.departure,
          airport: fr24Data.summary.orig_iata,
          scheduledTime: fr24Data.summary.sched_dep_ts,
          estimatedTime: fr24Data.summary.est_dep_ts,
          actualTime: fr24Data.summary.real_dep_ts,
          // Extract runway info from FR24 if available
          runway: fr24Data.summary.runway_takeoff,
          // Extract gate/terminal from FR24 if available (prioritize over Aviationstack)
          gate: fr24Data.summary.dep_gate,
          terminal: fr24Data.summary.dep_terminal
        };
        
        // Extract aircraft info from FR24 summary if available
        if (fr24Data.summary.reg || fr24Data.summary.type) {
          unifiedData.aircraft = {
            ...unifiedData.aircraft,
            registration: fr24Data.summary.reg || unifiedData.aircraft?.registration,
            type: this.mapAircraftType(fr24Data.summary.type || fr24Data.summary.model) || unifiedData.aircraft?.type,
            manufacturer: this.extractManufacturerFromType(fr24Data.summary.type || fr24Data.summary.model) || unifiedData.aircraft?.manufacturer,
            hex: fr24Data.summary.hex || unifiedData.aircraft?.hex
          };
          
          if (fr24Data.summary.reg) {
            unifiedData.photoUrl = this.generateAircraftPhotoUrl(fr24Data.summary.reg);
            console.log(`✈️ Added aircraft info from FR24 summary: ${unifiedData.aircraft.type} (${unifiedData.aircraft.registration})`);
          }
        }
        

        
        unifiedData.schedule.arrival = {
          ...unifiedData.schedule.arrival,
          airport: fr24Data.summary.dest_iata_actual || fr24Data.summary.dest_iata, // Use actual destination if diverted
          scheduledTime: fr24Data.summary.sched_arr_ts,
          estimatedTime: fr24EstimatedArrival || fr24Data.summary.est_arr_ts, // Prioritize live position ETA, then FR24 summary
          actualTime: actualArrivalFromEvents || fr24ActualArrival || fr24Data.summary.real_arr_ts, // Prioritize events, then live position, then summary
          // Extract runway info from FR24 if available
          runway: fr24Data.summary.runway_landed,
          // Extract gate/terminal/baggage from FR24 if available (prioritize over Aviationstack)
          gate: fr24Data.summary.arr_gate,
          terminal: fr24Data.summary.arr_terminal,
          baggage: fr24Data.summary.baggage_belt
        };
        

        
        console.log('🛬 Enhanced FR24 data extraction:', {
          departureRunway: fr24Data.summary.runway_takeoff,
          arrivalRunway: fr24Data.summary.runway_landed,
          actualDestination: fr24Data.summary.dest_iata_actual !== fr24Data.summary.dest_iata ? fr24Data.summary.dest_iata_actual : 'Same as planned',
          fr24Gate: fr24Data.summary.arr_gate,
          fr24Terminal: fr24Data.summary.arr_terminal,
          fr24Baggage: fr24Data.summary.baggage_belt,
          flightTime: fr24Data.summary.flight_time,
          actualDistance: fr24Data.summary.actual_distance,
          // Highlight FR24 estimated times (FETCHED, not calculated)
          fr24EstimatedDeparture: fr24Data.summary.est_dep_ts ? 'FETCHED from FR24' : 'Not available',
          fr24EstimatedArrival: fr24Data.summary.est_arr_ts ? 'FETCHED from FR24' : 'Not available',
          fr24LivePositionETA: fr24EstimatedArrival ? 'FETCHED from FR24 Live Position' : 'Not available'
        });

        // Debug the final unified data structure
        console.log('🔍 Final unified data structure after FR24 processing:', {
          departure: {
            scheduledTime: unifiedData.schedule.departure.scheduledTime,
            estimatedTime: unifiedData.schedule.departure.estimatedTime,
            actualTime: unifiedData.schedule.departure.actualTime,
            gate: unifiedData.schedule.departure.gate,
            terminal: unifiedData.schedule.departure.terminal,
            runway: unifiedData.schedule.departure.runway
          },
          arrival: {
            scheduledTime: unifiedData.schedule.arrival.scheduledTime,
            estimatedTime: unifiedData.schedule.arrival.estimatedTime,
            actualTime: unifiedData.schedule.arrival.actualTime,
            gate: unifiedData.schedule.arrival.gate,
            terminal: unifiedData.schedule.arrival.terminal,
            runway: unifiedData.schedule.arrival.runway,
            baggage: unifiedData.schedule.arrival.baggage
          }
        });
        
        // Log actual arrival time from FR24 for debugging
        console.log(`🛬 FR24 actual arrival time sources:`, {
          summary: fr24Data.summary.real_arr_ts || 'Not available',
          livePosition: fr24ActualArrival || 'Not available',
          events: actualArrivalFromEvents || 'Not available',
          final: unifiedData.schedule.arrival.actualTime || 'Not available'
        });
        
        // Set flight status from FR24 data (primary source for live flights)
        // Use events data for more accurate status determination
        const now = new Date();
        
        console.log('🔍 Raw FR24 timestamp data:', {
          datetime_landed: fr24Data.summary.datetime_landed,
          datetime_takeoff: fr24Data.summary.datetime_takeoff,
          sched_dep_ts: fr24Data.summary.sched_dep_ts,
          sched_arr_ts: fr24Data.summary.sched_arr_ts,
          real_dep_ts: fr24Data.summary.real_dep_ts,
          real_arr_ts: fr24Data.summary.real_arr_ts,
          est_dep_ts: fr24Data.summary.est_dep_ts,
          est_arr_ts: fr24Data.summary.est_arr_ts,
          hasEvents: !!fr24Data.events && fr24Data.events.length > 0,
          hasPositions: !!fr24Data.positions && fr24Data.positions.length > 0,
          positionsCount: fr24Data.positions?.length || 0
        });

        // Log live position data if available
        if (fr24Data.positions && fr24Data.positions.length > 0) {
          const latestPosition = fr24Data.positions[0];
          console.log('📍 Latest FR24 live position:', {
            lat: latestPosition.lat,
            lon: latestPosition.lon,
            alt: latestPosition.alt,
            gspeed: latestPosition.gspeed,
            track: latestPosition.track,
            eta: latestPosition.eta,
            timestamp: latestPosition.timestamp,
            source: latestPosition.source
          });
        }
        
        // Check FR24 events for more accurate status and actual arrival time
        let statusFromEvents = null;
        
        if (fr24Data.events && fr24Data.events.length > 0) {
          const latestEvent = fr24Data.events[fr24Data.events.length - 1];
          console.log('🎯 Latest FR24 event:', {
            type: latestEvent.type,
            description: latestEvent.description,
            time: latestEvent.time
          });
          
          // Map FR24 event types to flight status
          if (latestEvent.type === 'landed' || latestEvent.description?.toLowerCase().includes('landed')) {
            statusFromEvents = 'arrived';
            // If this is a landing event, the event time might be the actual arrival time
            actualArrivalFromEvents = latestEvent.time;
            console.log(`🛬 Found actual arrival time from landing event: ${actualArrivalFromEvents}`);
          } else if (latestEvent.type === 'airborne' || latestEvent.description?.toLowerCase().includes('airborne')) {
            statusFromEvents = 'en-route';
          } else if (latestEvent.type === 'departed' || latestEvent.description?.toLowerCase().includes('departed')) {
            statusFromEvents = 'en-route';
          } else if (latestEvent.type === 'boarding' || latestEvent.description?.toLowerCase().includes('boarding')) {
            statusFromEvents = 'boarding';
          }
          
          console.log('📊 Status from FR24 events:', statusFromEvents);
        }
        
        // Fallback to timestamp validation if no events or unclear event status
        // Handle both Unix timestamps (numbers) and ISO strings
        const landedTime = fr24Data.summary.datetime_landed ? 
          (typeof fr24Data.summary.datetime_landed === 'string' ? 
            new Date(fr24Data.summary.datetime_landed) : 
            new Date(fr24Data.summary.datetime_landed * 1000)) : null;
        const takeoffTime = fr24Data.summary.datetime_takeoff ? 
          (typeof fr24Data.summary.datetime_takeoff === 'string' ? 
            new Date(fr24Data.summary.datetime_takeoff) : 
            new Date(fr24Data.summary.datetime_takeoff * 1000)) : null;
        
        console.log('🕐 FR24 time validation:', {
          now: now.toISOString(),
          landedTime: landedTime && !isNaN(landedTime.getTime()) ? landedTime.toISOString() : 'Invalid',
          takeoffTime: takeoffTime && !isNaN(takeoffTime.getTime()) ? takeoffTime.toISOString() : 'Invalid',
          landedInPast: landedTime && !isNaN(landedTime.getTime()) ? landedTime < now : false,
          takeoffInPast: takeoffTime && !isNaN(takeoffTime.getTime()) ? takeoffTime < now : false
        });
        
        // Use events status if available, otherwise use timestamp validation
        if (statusFromEvents) {
          unifiedData.status = statusFromEvents;
          console.log(`✅ Using status from FR24 events: ${statusFromEvents}`);
        } else if (landedTime && !isNaN(landedTime.getTime()) && landedTime < now) {
          // Check if this is historical data (more than 12 hours ago)
          const hoursAgo = (now.getTime() - landedTime.getTime()) / (1000 * 60 * 60);
          if (hoursAgo > 12) {
            console.log(`⚠️ FR24 shows historical landing (${hoursAgo.toFixed(1)} hours ago), treating as today's scheduled flight`);
            unifiedData.status = 'scheduled';
          } else {
            unifiedData.status = 'arrived';
          }
        } else if (takeoffTime && !isNaN(takeoffTime.getTime()) && takeoffTime < now) {
          // Check if this is historical data (more than 12 hours ago)
          const hoursAgo = (now.getTime() - takeoffTime.getTime()) / (1000 * 60 * 60);
          if (hoursAgo > 12) {
            console.log(`⚠️ FR24 shows historical takeoff (${hoursAgo.toFixed(1)} hours ago), treating as today's scheduled flight`);
            unifiedData.status = 'scheduled';
          } else {
            unifiedData.status = 'en-route';
          }
        } else {
          // Flight hasn't taken off yet - use 'scheduled' as default
          // This will be refined later with Aviationstack schedule data
          unifiedData.status = 'scheduled';
        }
        
        unifiedData.dataQuality.hasScheduleData = true;
        unifiedData.dataQuality.confidence += 0.2;
        console.log(`🔧 Added FR24 schedule data: ${fr24Data.summary.orig_iata} → ${fr24Data.summary.dest_iata}, Status: ${unifiedData.status}`, {
          depEstimated: unifiedData.schedule.departure.estimatedTime,
          arrEstimated: unifiedData.schedule.arrival.estimatedTime,
          fr24Eta: fr24Data.positions?.[0]?.eta,
          hasLivePosition: !!fr24Data.positions && fr24Data.positions.length > 0
        });
        
        // Log final gate information for consistency check
        if (unifiedData.events && unifiedData.events.length > 0) {
          const gateEvents = unifiedData.events.filter(event => 
            event.type === 'gate_departure' || event.type === 'gate_arrival'
          );
          if (gateEvents.length > 0) {
            console.log('🚪 Final gate information in events:', gateEvents.map(event => ({
              type: event.type,
              gate: event.details?.gate_ident,
              description: event.description
            })));
          }
        }
      }
    }

    // Add Aviationstack data if available (ONLY for supplementary info like gates/terminals)
    if (aviationstackData) {
      console.log('🔍 Aviationstack data available for live flight:', {
        hasSchedule: !!aviationstackData.schedule,
        hasDeparture: !!aviationstackData.schedule?.departure,
        hasArrival: !!aviationstackData.schedule?.arrival,
        hasAircraft: !!aviationstackData.aircraft || !!aviationstackData.schedule?.aircraft,
        flightNumber: aviationstackData.schedule?.flight?.iataNumber,
        status: aviationstackData.schedule?.status,
        departure: {
          gate: aviationstackData.schedule?.departure?.gate,
          terminal: aviationstackData.schedule?.departure?.terminal,
          scheduledTime: aviationstackData.schedule?.departure?.scheduledTime,
          estimatedTime: aviationstackData.schedule?.departure?.estimatedTime,
          actualTime: aviationstackData.schedule?.departure?.actualTime,
          delay: aviationstackData.schedule?.departure?.delay,
          runway: aviationstackData.schedule?.departure?.actualRunway || aviationstackData.schedule?.departure?.estimatedRunway
        },
        arrival: {
          gate: aviationstackData.schedule?.arrival?.gate,
          terminal: aviationstackData.schedule?.arrival?.terminal,
          baggage: aviationstackData.schedule?.arrival?.baggage,
          scheduledTime: aviationstackData.schedule?.arrival?.scheduledTime,
          estimatedTime: aviationstackData.schedule?.arrival?.estimatedTime,
          actualTime: aviationstackData.schedule?.arrival?.actualTime,
          delay: aviationstackData.schedule?.arrival?.delay,
          runway: aviationstackData.schedule?.arrival?.actualRunway || aviationstackData.schedule?.arrival?.estimatedRunway
        },
        aircraft: {
          registration: aviationstackData.aircraft?.registration || aviationstackData.schedule?.aircraft?.registration,
          type: aviationstackData.aircraft?.type || aviationstackData.schedule?.aircraft?.type,
          model: aviationstackData.aircraft?.model || aviationstackData.schedule?.aircraft?.model
        }
      });
      
      // For live flights, only add supplementary data (gates, terminals) from Aviationstack
      // DO NOT override core flight data (times, airports) from FR24
      if (aviationstackData.schedule && aviationstackData.schedule.departure) {
        // Add comprehensive departure information from Aviationstack (only if not provided by FR24)
        unifiedData.schedule.departure = {
          ...unifiedData.schedule.departure,
          // Use FR24 data first, fallback to Aviationstack
          gate: unifiedData.schedule.departure.gate || aviationstackData.schedule.departure.gate,
          terminal: unifiedData.schedule.departure.terminal || aviationstackData.schedule.departure.terminal,
          runway: unifiedData.schedule.departure.runway || aviationstackData.schedule.departure.actualRunway || aviationstackData.schedule.departure.estimatedRunway,
          // For live flights: scheduled from Aviationstack, estimated/actual prefer FR24 but fallback to Aviationstack
          scheduledTime: aviationstackData.schedule.departure.scheduledTime || unifiedData.schedule.departure.scheduledTime,
          // PRIORITY: FR24 estimated time > Aviationstack estimated time > Calculated from delays (only as last resort)
          estimatedTime: unifiedData.schedule.departure.estimatedTime || aviationstackData.schedule.departure.estimatedTime || 
                        (aviationstackData.schedule.departure.delay ? this.calculateEstimatedTime(aviationstackData.schedule.departure.scheduledTime, aviationstackData.schedule.departure.delay) : undefined),
          actualTime: unifiedData.schedule.departure.actualTime || aviationstackData.schedule.departure.actualTime,
          delay: aviationstackData.schedule.departure.delay
        };
        
        console.log('✅ Added comprehensive departure info:', {
          gate: unifiedData.schedule.departure.gate,
          terminal: unifiedData.schedule.departure.terminal,
          runway: unifiedData.schedule.departure.runway,
          delay: unifiedData.schedule.departure.delay,
          scheduledTime: unifiedData.schedule.departure.scheduledTime,
          estimatedTime: unifiedData.schedule.departure.estimatedTime,
          actualTime: unifiedData.schedule.departure.actualTime,
          sources: {
            gate: fr24Data.summary?.dep_gate ? 'FR24' : (aviationstackData.schedule?.departure?.gate ? 'Aviationstack' : 'Not available'),
            terminal: fr24Data.summary?.dep_terminal ? 'FR24' : (aviationstackData.schedule?.departure?.terminal ? 'Aviationstack' : 'Not available'),
            runway: fr24Data.summary?.runway_takeoff ? 'FR24' : (aviationstackData.schedule?.departure?.actualRunway || aviationstackData.schedule?.departure?.estimatedRunway ? 'Aviationstack' : 'Not available'),
            estimatedTime: fr24Data.summary?.est_dep_ts ? 'FR24 Summary (Fetched)' : 
                          (aviationstackData.schedule?.departure?.estimatedTime ? 'Aviationstack (Fetched)' : 
                          (aviationstackData.schedule?.departure?.delay ? 'Calculated from delays (Last resort)' : 'Not available'))
          }
        });
        
        // Log gate consistency check
        console.log('🚪 Gate consistency check - Departure:', {
          flightCardGate: unifiedData.schedule.departure.gate,
          timelineGate: unifiedData.events?.find(e => e.type === 'gate_departure')?.details?.gate_ident,
          source: 'Aviationstack'
        });
      }
      if (aviationstackData.schedule && aviationstackData.schedule.arrival) {
        unifiedData.schedule.arrival = {
          ...unifiedData.schedule.arrival,
          // Use FR24 data first, fallback to Aviationstack
          gate: unifiedData.schedule.arrival.gate || aviationstackData.schedule.arrival.gate,
          terminal: unifiedData.schedule.arrival.terminal || aviationstackData.schedule.arrival.terminal,
          baggage: unifiedData.schedule.arrival.baggage || aviationstackData.schedule.arrival.baggage,
          runway: unifiedData.schedule.arrival.runway || aviationstackData.schedule.arrival.actualRunway || aviationstackData.schedule.arrival.estimatedRunway,
          // For live flights: scheduled from Aviationstack, estimated/actual prefer FR24 but fallback to Aviationstack
          scheduledTime: aviationstackData.schedule.arrival.scheduledTime || unifiedData.schedule.arrival.scheduledTime,
          // PRIORITY: FR24 estimated time > Aviationstack estimated time > Calculated from delays (only as last resort)
          estimatedTime: unifiedData.schedule.arrival.estimatedTime || aviationstackData.schedule.arrival.estimatedTime ||
                        (aviationstackData.schedule.arrival.delay ? this.calculateEstimatedTime(aviationstackData.schedule.arrival.scheduledTime, aviationstackData.schedule.arrival.delay) : undefined),
          actualTime: unifiedData.schedule.arrival.actualTime || aviationstackData.schedule.arrival.actualTime,
          delay: aviationstackData.schedule.arrival.delay
        };
        
        console.log('✅ Added comprehensive arrival info:', {
          gate: unifiedData.schedule.arrival.gate,
          terminal: unifiedData.schedule.arrival.terminal,
          baggage: unifiedData.schedule.arrival.baggage,
          runway: unifiedData.schedule.arrival.runway,
          delay: unifiedData.schedule.arrival.delay,
          scheduledTime: unifiedData.schedule.arrival.scheduledTime,
          estimatedTime: unifiedData.schedule.arrival.estimatedTime,
          actualTime: unifiedData.schedule.arrival.actualTime,
          sources: {
            gate: fr24Data.summary?.arr_gate ? 'FR24' : (aviationstackData.schedule?.arrival?.gate ? 'Aviationstack' : 'Not available'),
            terminal: fr24Data.summary?.arr_terminal ? 'FR24' : (aviationstackData.schedule?.arrival?.terminal ? 'Aviationstack' : 'Not available'),
            baggage: fr24Data.summary?.baggage_belt ? 'FR24' : (aviationstackData.schedule?.arrival?.baggage ? 'Aviationstack' : 'Not available'),
            runway: fr24Data.summary?.runway_landed ? 'FR24' : (aviationstackData.schedule?.arrival?.actualRunway || aviationstackData.schedule?.arrival?.estimatedRunway ? 'Aviationstack' : 'Not available'),
            estimatedTime: fr24EstimatedArrival ? 'FR24 Live Position (Fetched)' : 
                          (fr24Data.summary?.est_arr_ts ? 'FR24 Summary (Fetched)' : 
                          (aviationstackData.schedule?.arrival?.estimatedTime ? 'Aviationstack (Fetched)' : 
                          (aviationstackData.schedule?.arrival?.delay ? 'Calculated from delays (Last resort)' : 'Not available')))
          }
        });
        
        // Log final actual arrival time source
        if (unifiedData.schedule.arrival.actualTime) {
          const fr24ActualArr = fr24Data.summary?.real_arr_ts;
          const aviationEdgeActualArr = aviationstackData.schedule?.arrival?.actualTime;
          
          console.log(`🛬 Final actual arrival time: ${unifiedData.schedule.arrival.actualTime}`, {
            source: unifiedData.schedule.arrival.actualTime === actualArrivalFromEvents ? 'FR24 Events' :
                   unifiedData.schedule.arrival.actualTime === fr24ActualArr ? 'FR24 Summary' :
                   unifiedData.schedule.arrival.actualTime === fr24ActualArrival ? 'FR24 Live Position' :
                   unifiedData.schedule.arrival.actualTime === aviationEdgeActualArr ? 'Aviationstack' :
                   'Unknown',
            sources: {
              fr24Events: actualArrivalFromEvents || 'Not available',
              fr24Summary: fr24ActualArr || 'Not available',
              fr24LivePosition: fr24ActualArrival || 'Not available',
              aviationEdge: aviationEdgeActualArr || 'Not available'
            }
          });
        } else {
          console.log(`⚠️ No actual arrival time available from any source`);
        }
        
        // Log gate consistency check
        console.log('🚪 Gate consistency check - Arrival:', {
          flightCardGate: unifiedData.schedule.arrival.gate,
          timelineGate: unifiedData.events?.find(e => e.type === 'gate_arrival')?.details?.gate_ident,
          source: 'Aviationstack'
        });

        // Log final estimated arrival time source
        if (unifiedData.schedule.arrival.estimatedTime) {
          console.log(`🎯 Final estimated arrival time: ${unifiedData.schedule.arrival.estimatedTime}`, {
            source: fr24EstimatedArrival ? 'FR24 Live Position ETA' : 
                   unifiedData.schedule.arrival.estimatedTime === aviationstackData.schedule?.arrival?.estimatedTime ? 'Aviationstack' :
                   'Calculated from delay'
          });
        } else {
          console.log(`⚠️ No estimated arrival time available from any source`);
        }
      }

      // Add airline information with logo URL
      // For live flights, we need to enrich the airline data from AviationStack
      if (aviationstackData.airline || aviationstackData.schedule?.airline) {
        console.log(`🔍 Aviationstack airline data before enrichment:`, {
          name: aviationstackData.airline?.name,
          nameAirline: aviationstackData.airline?.nameAirline,
          iataCode: aviationstackData.airline?.iataCode || aviationstackData.schedule?.airline?.iataCode
        });
        
        // Build enriched airline info using the same method as convertScheduleToUnified
        const scheduleForAirline = {
          airline: aviationstackData.airline || aviationstackData.schedule?.airline || {},
          flight: { iataNumber: flightNumber }
        };
        
        const enrichedAirlineInfo = await this.buildAirlineInfo(scheduleForAirline);
        console.log(`🔍 Enriched airline info:`, enrichedAirlineInfo);
        
        unifiedData.airline = enrichedAirlineInfo;
        unifiedData.logoUrl = enrichedAirlineInfo.logoUrl;
        console.log(`🔧 Added enriched airline info to live flight: ${unifiedData.airline.name} (${unifiedData.airline.iataCode}) - Logo: ${unifiedData.logoUrl}`);
      }

      // Add schedule information if available (but preserve FR24 times!)
      if (aviationstackData.schedule) {
        if (aviationstackData.schedule.departure) {
          unifiedData.schedule.departure = {
            ...unifiedData.schedule.departure,
            // Preserve FR24 times, only add Aviationstack supplementary data
            gate: unifiedData.schedule.departure.gate || aviationstackData.schedule.departure.gate,
            terminal: unifiedData.schedule.departure.terminal || aviationstackData.schedule.departure.terminal,
            runway: unifiedData.schedule.departure.runway || aviationstackData.schedule.departure.actualRunway || aviationstackData.schedule.departure.estimatedRunway,
            delay: aviationstackData.schedule.departure.delay || unifiedData.schedule.departure.delay,
            // DO NOT override times - keep FR24 data
            // scheduledTime, estimatedTime, actualTime are preserved from FR24
          };
        }
        if (aviationstackData.schedule.arrival) {
          unifiedData.schedule.arrival = {
            ...unifiedData.schedule.arrival,
            // Preserve FR24 times, only add Aviationstack supplementary data
            gate: unifiedData.schedule.arrival.gate || aviationstackData.schedule.arrival.gate,
            terminal: unifiedData.schedule.arrival.terminal || aviationstackData.schedule.arrival.terminal,
            baggage: unifiedData.schedule.arrival.baggage || aviationstackData.schedule.arrival.baggage,
            runway: unifiedData.schedule.arrival.runway || aviationstackData.schedule.arrival.actualRunway || aviationstackData.schedule.arrival.estimatedRunway,
            delay: aviationstackData.schedule.arrival.delay || unifiedData.schedule.arrival.delay,
            // DO NOT override times - keep FR24 data
            // scheduledTime, estimatedTime, actualTime are preserved from FR24
          };
        }
      }

      // Add airport information (only if not already set by enhanced airport service)
      if (aviationstackData.departureAirport) {
        unifiedData.schedule.departure = {
          ...unifiedData.schedule.departure,
          // Only override if the enhanced airport service didn't provide better data
          airportName: unifiedData.schedule.departure.airportName || aviationstackData.departureAirport.nameAirport || aviationstackData.departureAirport.airport_name,
          airportCity: unifiedData.schedule.departure.airportCity || aviationstackData.departureAirport.nameCity || aviationstackData.departureAirport.city_iata_code,
          airportCountry: unifiedData.schedule.departure.airportCountry || aviationstackData.departureAirport.nameCountry || aviationstackData.departureAirport.country_name
        };
      }

      if (aviationstackData.arrivalAirport) {
        unifiedData.schedule.arrival = {
          ...unifiedData.schedule.arrival,
          // Only override if the enhanced airport service didn't provide better data
          airportName: unifiedData.schedule.arrival.airportName || aviationstackData.arrivalAirport.nameAirport || aviationstackData.arrivalAirport.airport_name,
          airportCity: unifiedData.schedule.arrival.airportCity || aviationstackData.arrivalAirport.nameCity || aviationstackData.arrivalAirport.city_iata_code,
          airportCountry: unifiedData.schedule.arrival.airportCountry || aviationstackData.arrivalAirport.nameCountry || aviationstackData.arrivalAirport.country_name
        };
      }
      
      // Update data quality
      unifiedData.dataQuality.source = 'Combined (FR24 + Aviationstack)';
      unifiedData.dataQuality.hasScheduleData = true;
      unifiedData.dataQuality.confidence = Math.min(0.95, unifiedData.dataQuality.confidence + 0.3);
      
      // Refine flight status using Aviationstack schedule data for better accuracy
      // This is especially important for flights scheduled today that haven't departed yet
      if (aviationstackData.schedule) {
        console.log('🔍 Aviationstack schedule data for status refinement:', {
          currentStatus: unifiedData.status,
          scheduleStatus: aviationstackData.schedule.status,
          scheduleType: aviationstackData.schedule.type,
          hasEstimatedDep: !!aviationstackData.schedule.departure?.estimatedTime,
          hasActualDep: !!aviationstackData.schedule.departure?.actualTime,
          hasEstimatedArr: !!aviationstackData.schedule.arrival?.estimatedTime,
          hasActualArr: !!aviationstackData.schedule.arrival?.actualTime,
          scheduledDepTime: aviationstackData.schedule.departure?.scheduledTime,
          estimatedDepTime: aviationstackData.schedule.departure?.estimatedTime,
          actualDepTime: aviationstackData.schedule.departure?.actualTime,
          scheduledArrTime: aviationstackData.schedule.arrival?.scheduledTime,
          estimatedArrTime: aviationstackData.schedule.arrival?.estimatedTime,
          actualArrTime: aviationstackData.schedule.arrival?.actualTime
        });
        
        // Note: Status refinement is now handled in the flight type determination section below
        // to avoid conflicts between FR24 live status and Aviationstack scheduled status
        
        // Set flight type flags - ensure clear separation between live and future flights
        // For live flights: Use FR24 status (en-route, arrived, etc.)
        // For scheduled flights: Use Aviationstack status (scheduled, delayed, boarding, etc.)
        
        // FIRST: Determine if this is actually a live flight (in air or landed)
        // Enhanced logic with force status check and time zone handling
        const hasLivePositions = fr24Data.positions && fr24Data.positions.length > 0;
        const hasLiveData = fr24Data.live && Object.keys(fr24Data.live).length > 0;
        const hasRecentEvents = fr24Data.events && fr24Data.events.length > 0;
        const hasCoordinates = fr24Data.live?.lat && fr24Data.live?.lon;
        
        // Force Status Check: Always check the status field values
        const fr24Status = unifiedData.status; // This comes from FR24 events or timestamp validation
        const aviationEdgeStatus = aviationstackData?.schedule?.status;
        
        console.log('🔍 Force Status Check:', {
          fr24Status,
          aviationEdgeStatus,
          hasCoordinates,
          hasLivePositions,
          hasLiveData,
          hasRecentEvents
        });
        
        // Cross-Reference with Position Data: If coordinates are available → definitely live
        if (hasCoordinates) {
        }
        
        // Enhanced time zone handling for flights crossing date boundaries
        const scheduledDepTime = aviationstackData?.schedule?.departure?.scheduledTime;
        const scheduledArrTime = aviationstackData?.schedule?.arrival?.scheduledTime;
        let isScheduledForToday = false;
        let isPastScheduledTime = false;
        let crossesDateBoundary = false;
        
        if (scheduledDepTime) {
          try {
            const scheduledDepUTC = new Date(scheduledDepTime);
            const nowUTC = new Date();
            
            // Check if scheduled arrival is on a different date (time zone crossing)
            if (scheduledArrTime) {
              const scheduledArrUTC = new Date(scheduledArrTime);
              const depDate = scheduledDepUTC.toISOString().split('T')[0];
              const arrDate = scheduledArrUTC.toISOString().split('T')[0];
              crossesDateBoundary = depDate !== arrDate;
            }
            
            if (!isNaN(scheduledDepUTC.getTime())) {
              // For time zone crossing flights, use a wider window (48 hours)
              const timeWindow = crossesDateBoundary ? 48 : 24;
              const timeDiffHours = Math.abs(nowUTC.getTime() - scheduledDepUTC.getTime()) / (1000 * 60 * 60);
              isScheduledForToday = timeDiffHours <= timeWindow;
              
              // Check if past scheduled time (no buffer for more accurate determination)
              isPastScheduledTime = nowUTC > scheduledDepUTC;
              
              console.log('🕐 Enhanced time zone analysis:', {
                scheduledDepTime: scheduledDepTime,
                scheduledArrTime: scheduledArrTime,
                scheduledDepUTC: scheduledDepUTC.toISOString(),
                nowUTC: nowUTC.toISOString(),
                crossesDateBoundary,
                isScheduledForToday,
                isPastScheduledTime,
                timeDiffHours: (nowUTC.getTime() - scheduledDepUTC.getTime()) / (1000 * 60 * 60),
                timeWindow
              });
            }
          } catch (error) {
            console.log('⚠️ Error parsing scheduled times:', error);
          }
        }
        
        // Enhanced live flight determination with force status check
        // Priority order:
        // 1. If coordinates are available → definitely live
        // 2. If status=en-route but shows scheduled times → override as Live
        // 3. If no coordinates but status=scheduled while current UTC > departure UTC → assume live
        // 4. Cross-reference with FR24 events and position data
        
        let isActuallyLive = false;
        let liveReason = '';
        
        if (hasCoordinates) {
          isActuallyLive = true;
          liveReason = 'Has live coordinates (lat/lon)';
        } else if (fr24Status === 'en-route' || fr24Status === 'arrived') {
          isActuallyLive = true;
          liveReason = `FR24 status indicates ${fr24Status}`;
        } else if (aviationEdgeStatus === 'active' && isPastScheduledTime && (hasLiveData || hasRecentEvents)) {
          isActuallyLive = true;
          liveReason = 'Aviationstack status=active + past departure time + has live data';
        } else if (!hasCoordinates && aviationEdgeStatus === 'scheduled' && isPastScheduledTime && (hasLiveData || hasRecentEvents)) {
          // No coordinates but scheduled while past departure time AND has live data - likely live
          isActuallyLive = true;
          liveReason = 'No coordinates but past scheduled departure time + has live data';
        } else if (hasLivePositions || (hasLiveData && hasRecentEvents && isPastScheduledTime)) {
          isActuallyLive = true;
          liveReason = 'Has live positions or (live data + events + past scheduled time)';
        } else if (isScheduledForToday && !isPastScheduledTime) {
          // Same-day flight but not yet past departure time - definitely scheduled
          liveReason = 'Same-day flight but not yet past departure time - treating as scheduled';
        } else if (isScheduledForToday && isPastScheduledTime && !hasLiveData && !hasRecentEvents) {
          // Same-day flight past departure time but no live data - likely delayed, keep as scheduled
          liveReason = 'Same-day flight past departure time but no live data - treating as scheduled (likely delayed)';
        } else {
          liveReason = 'Does not meet live flight criteria - treating as scheduled';
        }
        
        console.log('🔍 Enhanced Live flight determination:', {
          status: unifiedData.status,
          fr24Status,
          aviationEdgeStatus,
          hasLivePositions,
          hasLiveData,
          hasRecentEvents,
          hasCoordinates,
          scheduledDepTime,
          isScheduledForToday,
          isPastScheduledTime,
          crossesDateBoundary,
          isActuallyLive,
          reason: liveReason
        });
        
        if (isActuallyLive) {
          // This is a truly live flight (airborne or landed)
          unifiedData.isLive = true;
          unifiedData.isFutureFlight = false;
          console.log(`🔴 Confirmed as live flight: ${unifiedData.status} - Reason: ${liveReason}`);
          
          // Force status override for en-route flights that show as scheduled
          if ((fr24Status === 'en-route' || fr24Status === 'arrived') && aviationEdgeStatus === 'scheduled') {
            console.log(`🔄 Force status override: ${aviationEdgeStatus} → ${fr24Status} (FR24 takes priority for live flights)`);
            // Keep the FR24 status that was already set
          }
          
          // For live flights with coordinates, ensure status reflects flight state
          if (hasCoordinates && unifiedData.status === 'scheduled') {
            unifiedData.status = 'en-route';
          }
          
          // For live flights, delay status should come from FR24, not Aviationstack
          // Aviationstack delays are for scheduled flights, not live ones
          
        } else {
          // This is a scheduled flight for today but not yet live
          unifiedData.isLive = false;
          unifiedData.isFutureFlight = true;
          console.log(`🔮 Confirmed as scheduled flight - Reason: ${liveReason}`);
          
          // For scheduled flights, use Aviationstack status and delay information
          if (unifiedData.status === 'scheduled' || unifiedData.status === 'en-route') {
            const aviationEdgeStatus = this.determineStatusFromSchedule(aviationstackData.schedule);
            if (aviationEdgeStatus && aviationEdgeStatus !== 'unknown') {
              unifiedData.status = aviationEdgeStatus;
              console.log(`🔄 Updated status for scheduled flight using Aviationstack: ${aviationEdgeStatus}`);
            }
          }
          
          // Check for delays and update status accordingly (ONLY for scheduled flights)
          const departureDelay = aviationstackData.schedule?.departure?.delay;
          const arrivalDelay = aviationstackData.schedule?.arrival?.delay;
          
          if (departureDelay && departureDelay > 15) {
            unifiedData.status = 'delayed';
            console.log(`⏰ Scheduled flight delayed: ${departureDelay} minutes delay detected`);
          } else if (arrivalDelay && arrivalDelay > 15) {
            unifiedData.status = 'delayed';
            console.log(`⏰ Scheduled flight delayed: ${arrivalDelay} minutes delay detected`);
          }
          
          console.log(`🔮 Final status for scheduled flight: ${unifiedData.status}`);
        }
        
        // Final classification summary
        console.log(`🎯 Final flight classification:`, {
          isLive: unifiedData.isLive,
          isFutureFlight: unifiedData.isFutureFlight,
          status: unifiedData.status,
          source: unifiedData.isLive ? 'FR24 Live Data' : 'Aviationstack Schedule',
          hasLivePositions,
          hasLiveData,
          hasRecentEvents
        });
      }
      
      // Final gate consistency summary
      console.log('🚪 Final gate consistency summary:', {
        departure: {
          flightCard: unifiedData.schedule.departure.gate,
          timeline: unifiedData.events?.find(e => e.type === 'gate_departure')?.details?.gate_ident,
          source: 'Aviationstack'
        },
        arrival: {
          flightCard: unifiedData.schedule.arrival.gate,
          timeline: unifiedData.events?.find(e => e.type === 'gate_arrival')?.details?.gate_ident,
          source: 'Aviationstack'
        }
      });
      
      // Add aircraft information from multiple sources
      if (aviationstackData.aircraft) {
        unifiedData.aircraft = {
          ...unifiedData.aircraft,
          registration: aviationstackData.aircraft.registration || aviationstackData.aircraft.regNumber,
          type: this.mapAircraftType(aviationstackData.aircraft.type || aviationstackData.aircraft.modelCode),
          manufacturer: this.extractManufacturerFromType(aviationstackData.aircraft.type || aviationstackData.aircraft.modelCode),
          model: aviationstackData.aircraft.model || aviationstackData.aircraft.modelText,
          year: aviationstackData.aircraft.year,
          hex: aviationstackData.aircraft.hex
        };
        
        // Set aircraft photo URL
        if (unifiedData.aircraft.registration) {
          unifiedData.photoUrl = this.generateAircraftPhotoUrl(unifiedData.aircraft.registration);
        }
        
        console.log(`✈️ Added aircraft info from Aviationstack: ${unifiedData.aircraft.type} (${unifiedData.aircraft.registration})`);
      }
      
      // Also check if aircraft info is embedded in schedule data
      if (aviationstackData.schedule?.aircraft) {
        const scheduleAircraft = aviationstackData.schedule.aircraft;
        unifiedData.aircraft = {
          ...unifiedData.aircraft,
          registration: scheduleAircraft.registration || scheduleAircraft.regNumber || unifiedData.aircraft?.registration,
          type: this.mapAircraftType(scheduleAircraft.type || scheduleAircraft.modelCode) || unifiedData.aircraft?.type,
          manufacturer: this.extractManufacturerFromType(scheduleAircraft.type || scheduleAircraft.modelCode) || unifiedData.aircraft?.manufacturer,
          model: scheduleAircraft.model || scheduleAircraft.modelText || unifiedData.aircraft?.model,
          year: scheduleAircraft.year || unifiedData.aircraft?.year,
          hex: scheduleAircraft.hex || unifiedData.aircraft?.hex
        };
        
        // Set aircraft photo URL if we got registration from schedule
        if (unifiedData.aircraft.registration && !unifiedData.photoUrl) {
          unifiedData.photoUrl = this.generateAircraftPhotoUrl(unifiedData.aircraft.registration);
        }
        
        console.log(`✈️ Added aircraft info from schedule: ${unifiedData.aircraft.type} (${unifiedData.aircraft.registration})`);
      }

      // Extract aircraft info from FR24 live data (prioritize FR24 as authoritative source)
      if (fr24Data?.live && (fr24Data.live.reg || fr24Data.live.type)) {
        unifiedData.aircraft = {
          ...unifiedData.aircraft,
          registration: fr24Data.live.reg || unifiedData.aircraft?.registration,
          type: this.mapAircraftType(fr24Data.live.type) || unifiedData.aircraft?.type,
          manufacturer: this.extractManufacturerFromType(fr24Data.live.type) || unifiedData.aircraft?.manufacturer,
          hex: fr24Data.live.hex || unifiedData.aircraft?.hex
        };
        
        if (fr24Data.live.reg) {
          unifiedData.photoUrl = this.generateAircraftPhotoUrl(fr24Data.live.reg);
          console.log(`✈️ Added aircraft info from FR24 live: ${unifiedData.aircraft.type} (${unifiedData.aircraft.registration})`);
        }
      }
      
      // Check for aircraft data
      if (unifiedData.aircraft?.registration || unifiedData.aircraft?.type) {
        unifiedData.dataQuality.hasAircraftData = true;
        unifiedData.dataQuality.confidence += 0.1;
      }
    } else {
      // Even without Aviationstack data, set logo URL based on parsed airline code
      const { airlineCode } = this.parseFlightNumber(flightNumber);
      if (airlineCode) {
        unifiedData.airline.iataCode = airlineCode;
        unifiedData.logoUrl = `http://img.wway.io/pics/root/${airlineCode.toUpperCase()}@png?exar=1&rs=fit:200:200`;
        console.log(`🔧 Set logo URL for live flight based on parsed code: ${airlineCode} - Logo: ${unifiedData.logoUrl}`);
      }
    }
    
    // Final departure time summary
    console.log(`🛫 Final departure time summary:`, {
      scheduled: unifiedData.schedule.departure.scheduledTime,
      estimated: unifiedData.schedule.departure.estimatedTime,
      actual: unifiedData.schedule.departure.actualTime,
      hasEstimatedTime: !!unifiedData.schedule.departure.estimatedTime,
      hasActualTime: !!unifiedData.schedule.departure.actualTime,
      sources: {
        fr24Summary: fr24Data.summary?.est_dep_ts || 'Not available',
        aviationEdge: aviationstackData.schedule?.departure?.estimatedTime || 'Not available'
      }
    });

    // Final arrival time summary
    console.log(`🛬 Final arrival time summary:`, {
      scheduled: unifiedData.schedule.arrival.scheduledTime,
      estimated: unifiedData.schedule.arrival.estimatedTime,
      actual: unifiedData.schedule.arrival.actualTime,
      hasEstimatedTime: !!unifiedData.schedule.arrival.estimatedTime,
      hasActualTime: !!unifiedData.schedule.arrival.actualTime,
      sources: {
        fr24Summary: fr24Data.summary?.est_arr_ts || 'Not available',
        fr24LivePosition: fr24EstimatedArrival || 'Not available',
        fr24Events: actualArrivalFromEvents || 'Not available',
        aviationEdge: aviationstackData.schedule?.arrival?.estimatedTime || 'Not available'
      }
    });

    // Final debug log before returning
    console.log('🔍 Final unified data being returned:', {
      flightNumber: unifiedData.flightNumber,
      departure: {
        scheduledTime: unifiedData.schedule.departure.scheduledTime,
        estimatedTime: unifiedData.schedule.departure.estimatedTime,
        actualTime: unifiedData.schedule.departure.actualTime,
        gate: unifiedData.schedule.departure.gate,
        terminal: unifiedData.schedule.departure.terminal,
        runway: unifiedData.schedule.departure.runway
      },
      arrival: {
        scheduledTime: unifiedData.schedule.arrival.scheduledTime,
        estimatedTime: unifiedData.schedule.arrival.estimatedTime,
        actualTime: unifiedData.schedule.arrival.actualTime,
        gate: unifiedData.schedule.arrival.gate,
        terminal: unifiedData.schedule.arrival.terminal,
        runway: unifiedData.schedule.arrival.runway,
        baggage: unifiedData.schedule.arrival.baggage
      },
      status: unifiedData.status,
      isLive: unifiedData.isLive
    });

    return unifiedData;
  }

  /**
   * Get airport timetable data using Aviationstack API
   */
  async getAirportTimetable(params: {
    airport: string;
    type: 'departure' | 'arrival';
    date?: Date;
    timeRange?: 'current' | 'past' | 'future' | 'custom';
    hoursOffset?: number;
    airline?: string;
    status?: string;
  }): Promise<UnifiedFlightData[]> {
    console.log(`🛫 Getting airport timetable for ${params.airport} (${params.type})`);
    
    // Create cache key for timetable data
    const cacheKey = `timetable_${params.airport}_${params.type}_${params.timeRange || 'current'}_${params.hoursOffset || 24}_${params.airline || ''}_${params.status || ''}`;
    
    // Check cache first (15 minute cache for timetables to reduce API calls)
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 15 * 60 * 1000) {
      console.log(`⚡ Using cached timetable data for ${params.airport}`);
      return cached.data;
    }
    
    try {
      // Use Aviationstack timetable API for current day schedules
      const timetableResponse = await aviationstackService.getTimetable({
        iataCode: params.airport,
        type: params.type,
        status: params.status,
        airline_iata: params.airline
      });

      if (!timetableResponse || !Array.isArray(timetableResponse)) {
        console.log(`⚠️ No timetable data received from Aviationstack for ${params.airport}`);
        return [];
      }

      console.log(`📋 Received ${timetableResponse.length} timetable entries from Aviationstack`);
      
      // Debug: Check what airport the flights are actually from
      if (timetableResponse.length > 0) {
        const sampleFlight = timetableResponse[0];
        console.log(`🔍 Sample flight airport info:`, {
          departureAirport: sampleFlight.departure?.iataCode,
          arrivalAirport: sampleFlight.arrival?.iataCode,
          requestedAirport: params.airport,
          flightNumber: sampleFlight.flight?.iataNumber
        });
      }
      
      // Get all flights for the day (no artificial limit)
      const limitedSchedules = timetableResponse;
      console.log(`📋 Processing all ${limitedSchedules.length} entries for the day`);

      // Debug: Log sample schedule data structure
      if (limitedSchedules.length > 0) {
        console.log('🔍 Sample Aviationstack schedule structure:', {
          airline: limitedSchedules[0].airline,
          flight: limitedSchedules[0].flight,
          departure: limitedSchedules[0].departure,
          arrival: limitedSchedules[0].arrival,
          codeshared: limitedSchedules[0].codeshared,
          status: limitedSchedules[0].status,
          type: limitedSchedules[0].type
        });
      }

      // Convert Aviationstack schedules to unified format
      const results = await Promise.all(
        limitedSchedules.map(schedule => this.convertAviationstackScheduleToUnified(schedule, params.type))
      );
      
      // Filter for flights scheduled between current time and next 4 hours for UI display
      // Note: Aviationstack returns times in local airport time, so we need to handle this properly
      const timeFilteredResults = this.filterFlightsByTimeWindow(results, params.type, 4);
      
      // Remove codeshare duplicates
      const deduplicatedResults = this.removeCodeshareDuplicates(timeFilteredResults);
      
      // Cache the results
      this.cache.set(cacheKey, { data: deduplicatedResults, timestamp: Date.now() });
      
      console.log(`✅ Converted ${limitedSchedules.length} schedules to unified format, showing ${deduplicatedResults.length} flights in UI (4h window) (cached)`);
      return deduplicatedResults;
      
    } catch (error) {
      console.error(`❌ Error getting airport timetable:`, error);
      return [];
    }
  }

  /**
   * Convert Aviationstack schedule format to unified format
   */
  private async convertAviationstackScheduleToUnified(
    schedule: any, 
    _type: 'departure' | 'arrival'
  ): Promise<UnifiedFlightData> {
    try {
      // Parse flight number from IATA or ICAO format
      const flightNumber = schedule.flight?.iataNumber || 
                          schedule.flight?.icaoNumber || 
                          schedule.flight?.number || 
                          'Unknown';

      // Parse airline information
      const airline = schedule.airline ? {
        name: schedule.airline.name || 'Unknown Airline',
        iataCode: schedule.airline.iataCode || '',
        icaoCode: schedule.airline.icaoCode || ''
      } : {
        name: 'Unknown Airline',
        iataCode: '',
        icaoCode: ''
      };

      // Fetch airport information for departure and arrival
      const [departureAirportInfo, arrivalAirportInfo] = await Promise.all([
        schedule.departure?.iataCode ? this.getAirportInfo(schedule.departure.iataCode) : Promise.resolve({}),
        schedule.arrival?.iataCode ? this.getAirportInfo(schedule.arrival.iataCode) : Promise.resolve({})
      ]);

      // Debug logging for airport info
      console.log('🔍 Airport info fetched in convertAviationstackScheduleToUnified:', {
        departure: { iataCode: schedule.departure?.iataCode, info: departureAirportInfo },
        arrival: { iataCode: schedule.arrival?.iataCode, info: arrivalAirportInfo }
      });

      // Parse departure information
      const departure = schedule.departure ? {
        airport: schedule.departure.iataCode || '',
        airportName: (departureAirportInfo as any).name || schedule.departure.airport || '',
        airportCity: (departureAirportInfo as any).city || '',
        airportCountry: (departureAirportInfo as any).country || '',
        scheduledTime: this.parseAviationstackTime(schedule.departure.scheduledTime),
        estimatedTime: this.parseAviationstackTime(schedule.departure.estimatedTime),
        actualTime: this.parseAviationstackTime(schedule.departure.actualTime),
        gate: schedule.departure.gate || '',
        terminal: schedule.departure.terminal || '',
        delay: schedule.departure.delay ? parseInt(schedule.departure.delay) : 0
      } : {
        airport: '',
        airportName: '',
        airportCity: '',
        airportCountry: '',
        scheduledTime: undefined,
        estimatedTime: undefined,
        actualTime: undefined,
        gate: '',
        terminal: '',
        delay: 0
      };

      // Parse arrival information
      const arrival = schedule.arrival ? {
        airport: schedule.arrival.iataCode || '',
        airportName: (arrivalAirportInfo as any).name || schedule.arrival.airport || '',
        airportCity: (arrivalAirportInfo as any).city || '',
        airportCountry: (arrivalAirportInfo as any).country || '',
        scheduledTime: this.parseAviationstackTime(schedule.arrival.scheduledTime),
        estimatedTime: this.parseAviationstackTime(schedule.arrival.estimatedTime),
        actualTime: this.parseAviationstackTime(schedule.arrival.actualTime),
        gate: schedule.arrival.gate || '',
        terminal: schedule.arrival.terminal || '',
        delay: schedule.arrival.delay ? parseInt(schedule.arrival.delay) : 0
      } : {
        airport: '',
        airportName: '',
        airportCity: '',
        airportCountry: '',
        scheduledTime: undefined,
        estimatedTime: undefined,
        actualTime: undefined,
        gate: '',
        terminal: '',
        delay: 0
      };

      // Parse aircraft information
      const aircraft = schedule.aircraft ? {
        registration: schedule.aircraft.registration || '',
        type: schedule.aircraft.iata || '',
        manufacturer: '',
        model: schedule.aircraft.icao || '',
        year: undefined,
        hex: schedule.aircraft.icao24 || ''
      } : undefined;

      // Parse codeshare information
      const codeshare = schedule.codeshared ? {
        airline: {
          name: schedule.codeshared.airline?.name || '',
          iata: schedule.codeshared.airline?.iataCode || '',
          icao: schedule.codeshared.airline?.icaoCode || ''
        },
        flight: {
          iataNumber: schedule.codeshared.flight?.iataNumber || '',
          icaoNumber: schedule.codeshared.flight?.icaoNumber || '',
          number: schedule.codeshared.flight?.number || ''
        }
      } : null;

      return {
        id: `${flightNumber}-${schedule.departure?.iataCode || 'UNK'}-${schedule.arrival?.iataCode || 'UNK'}-${Date.now()}`,
        flightNumber,
        flight: {
          number: schedule.flight?.number || '',
          iataNumber: schedule.flight?.iataNumber || flightNumber,
          icaoNumber: schedule.flight?.icaoNumber || ''
        },
        airline,
        aircraft,
        schedule: {
          departure,
          arrival
        },
        status: this.mapAviationstackStatus(schedule.status, schedule),
        codeshare,
        dataQuality: {
          source: 'aviationstack',
          confidence: 0.8,
          hasLiveData: false,
          hasScheduleData: true,
          hasAircraftData: !!aircraft
        }
      };

    } catch (error) {
      console.error('❌ Error converting Aviationstack schedule to unified format:', error);
      throw error;
    }
  }

  /**
   * Parse Aviationstack time format (YYYY-MM-DDTHH:MM:SS.000)
   */
  private parseAviationstackTime(timeString: string | null | undefined): string | undefined {
    if (!timeString) return undefined;
    
    try {
      // Aviationstack returns times in format: "2025-09-12T03:00:00.000"
      // Use the time as-is without any timezone conversion
      const date = new Date(timeString);
      
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Invalid time format: ${timeString}`);
        return undefined;
      }
      
      // Return the time as-is from Aviationstack
      return date.toISOString();
    } catch (error) {
      console.warn(`⚠️ Error parsing time ${timeString}:`, error);
      return undefined;
    }
  }

  /**
   * Map Aviationstack status to unified status with delay checking
   */
  private mapAviationstackStatus(status: string | undefined, schedule?: any): string {
    if (!status) {
      console.log('⚠️ No status provided, defaulting to scheduled');
      return 'scheduled';
    }
    
    // Use Aviationstack status values directly (including 'unknown' which they do return)
    const validStatuses = ['scheduled', 'active', 'landed', 'cancelled', 'incident', 'diverted', 'redirected', 'unknown', 'delayed'];
    const normalizedStatus = status.toLowerCase();
    
    // Return the status if it's valid, otherwise default to 'scheduled'
    let mappedStatus = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'scheduled';
    
    if (!validStatuses.includes(normalizedStatus)) {
      console.log(`⚠️ Invalid status "${status}", defaulting to "scheduled"`);
    }
    
    // Check for delay override: if status is 'active' and ETD is >20min past scheduled time, show as 'delayed'
    if (mappedStatus === 'active' && schedule) {
      const delayedStatus = this.checkForDelayOverride(schedule);
      if (delayedStatus) {
        mappedStatus = delayedStatus;
      }
    }
    
    return mappedStatus;
  }

  /**
   * Check if flight should be marked as delayed based on ETD vs scheduled time
   */
  private checkForDelayOverride(schedule: any): string | null {
    try {
      // Get scheduled departure time
      const scheduledTimeStr = schedule.departure?.scheduledTime;
      if (!scheduledTimeStr) return null;

      // Get estimated departure time
      const estimatedTimeStr = schedule.departure?.estimatedTime;
      if (!estimatedTimeStr) return null;

      const scheduledTime = new Date(scheduledTimeStr);
      const estimatedTime = new Date(estimatedTimeStr);
      const now = new Date();

      // Only check if flight is currently active (not in the past)
      if (scheduledTime <= now) {
        // Calculate delay in minutes
        const delayMinutes = (estimatedTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        
        // If delay is more than 20 minutes, mark as delayed
        if (delayMinutes > 20) {
          console.log(`⏰ Flight ${schedule.flight?.iata || 'Unknown'} delayed: ${delayMinutes.toFixed(0)}min past scheduled time`);
          return 'delayed';
        }
      }

      return null;
    } catch (error) {
      console.warn('Error checking delay override:', error);
      return null;
    }
  }

  /**
   * Filter flights by time window (current time + next X hours)
   */
  private filterFlightsByTimeWindow(flights: UnifiedFlightData[], type: 'departure' | 'arrival', hoursAhead: number = 4): UnifiedFlightData[] {
    const now = new Date();
    const futureTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
    const pastTime = new Date(now.getTime() - (30 * 60 * 1000)); // 30 minutes ago
    
    console.log(`🕐 Current time: ${now.toISOString()}`);
    console.log(`🕐 UI Filtering: Showing flights from 30min ago to ${hoursAhead}h ahead`);
    
    const filteredResults = flights.filter(flight => {
      const flightTime = this.getFlightTime(flight, type);
      if (!flightTime) {
        console.log(`⚠️ No valid time found for flight ${flight.flightNumber}`);
        return false;
      }
      
      // Check if flight is within the UI time window (30min ago to 4h ahead)
      const isInTimeWindow = flightTime >= pastTime && flightTime <= futureTime;
      
      if (!isInTimeWindow) {
        console.log(`⏰ Hiding flight ${flight.flightNumber}: ${flightTime.toISOString()} - outside UI time window`);
      } else {
        console.log(`✅ Showing flight ${flight.flightNumber}: ${flightTime.toISOString()} - within UI time window`);
      }
      
      return isInTimeWindow;
    });
    
    console.log(`🕐 UI Filtered ${flights.length} flights to ${filteredResults.length} flights for display (30min ago to ${hoursAhead}h ahead)`);
    return filteredResults;
  }


  /**
   * Remove codeshare duplicate flights to avoid showing the same flight multiple times
   */
  private removeCodeshareDuplicates(flights: UnifiedFlightData[]): UnifiedFlightData[] {
    const seenRoutes = new Map<string, UnifiedFlightData>();
    const uniqueFlights: UnifiedFlightData[] = [];
    let duplicateCount = 0;
    
    // Sort flights to prioritize main operating carriers (flights without codeshare data)
    const sortedFlights = [...flights].sort((a, b) => {
      const aHasCodeshare = a.codeshare && a.codeshare.airline && a.codeshare.airline.name;
      const bHasCodeshare = b.codeshare && b.codeshare.airline && b.codeshare.airline.name;
      
      // Flights without codeshare data come first (main operating carriers)
      if (!aHasCodeshare && bHasCodeshare) return -1;
      if (aHasCodeshare && !bHasCodeshare) return 1;
      return 0;
    });
    
    for (const flight of sortedFlights) {
      const depAirport = flight.schedule?.departure?.airport || 'UNK';
      const arrAirport = flight.schedule?.arrival?.airport || 'UNK';
      const scheduledTime = flight.schedule?.departure?.scheduledTime || 
                           flight.schedule?.arrival?.scheduledTime || 
                           'UNK';
      
      // Create a route+time key to identify the same physical flight
      const routeTimeKey = `${depAirport}-${arrAirport}-${scheduledTime}`;
      
      // Check if this flight has codeshare data
      const hasCodeshare = flight.codeshare && 
                          flight.codeshare.airline && 
                          flight.codeshare.airline.name;
      
      // If we've already seen this route+time, it's a codeshare duplicate
      if (seenRoutes.has(routeTimeKey)) {
        const existingFlight = seenRoutes.get(routeTimeKey);
        duplicateCount++;
        console.log(`🔄 Filtering out codeshare duplicate: ${flight.flightNumber} (${depAirport} → ${arrAirport}) at ${scheduledTime}${hasCodeshare ? ' [CODESHARE]' : ''} - keeping ${existingFlight?.flightNumber}`);
        continue;
      }
      
      // Add this flight to our seen routes and unique flights
      seenRoutes.set(routeTimeKey, flight);
      uniqueFlights.push(flight);
      
      if (hasCodeshare) {
        console.log(`✅ Keeping flight: ${flight.flightNumber} (${depAirport} → ${arrAirport}) at ${scheduledTime} [codeshare with ${flight.codeshare?.airline.name}]`);
      } else {
        console.log(`✅ Keeping main flight: ${flight.flightNumber} (${depAirport} → ${arrAirport}) at ${scheduledTime}`);
      }
    }
    
    console.log(`🔄 Removed ${duplicateCount} codeshare duplicates from ${flights.length} total flights`);
    return uniqueFlights;
  }

  /**
   * Get the appropriate flight time (departure or arrival) from a flight object
   */
  private getFlightTime(flight: UnifiedFlightData, type: 'departure' | 'arrival'): Date | null {
    try {
      if (type === 'departure') {
        // Try actual time first, then estimated, then scheduled
        const timeString = flight.schedule?.departure?.actualTime || 
                          flight.schedule?.departure?.estimatedTime || 
                          flight.schedule?.departure?.scheduledTime;
        
        if (timeString) {
          return this.parseFlightTime(timeString, flight.flightNumber, type);
        }
      } else {
        // Try actual time first, then estimated, then scheduled
        const timeString = flight.schedule?.arrival?.actualTime || 
                          flight.schedule?.arrival?.estimatedTime || 
                          flight.schedule?.arrival?.scheduledTime;
        
        if (timeString) {
          return this.parseFlightTime(timeString, flight.flightNumber, type);
        }
      }
      
      console.log(`⚠️ No time found for flight ${flight.flightNumber} (${type})`);
      return null;
    } catch (error) {
      console.warn('Error parsing flight time:', error);
      return null;
    }
  }

  /**
   * Parse flight time with proper timezone handling for Delhi airport
   */
  private parseFlightTime(timeString: string, flightNumber: string, type: string): Date {
    // Check if this time format needs timezone conversion
    // Format like "2025-09-11T15:30:00.000" without timezone suffix should be treated as IST
    
    if (timeString.includes('T') && !timeString.includes('+') && !timeString.includes('Z')) {
      // This looks like local time without timezone info
      // For Delhi airport, interpret as IST (UTC+5:30)
      const match = timeString.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
      if (match) {
        const [, datePart, timePart] = match;
        // Create date with IST timezone
        const istTime = new Date(`${datePart}T${timePart}+05:30`);
        console.log(`🕐 Parsed time for ${flightNumber} (${type}): ${timeString} -> IST: ${istTime.toISOString()} (${istTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)`);
        return istTime;
      }
    }
    
    // Fallback to parsing as-is
    const parsedTime = new Date(timeString);
    console.log(`🕐 Parsed time for ${flightNumber} (${type}): ${timeString} -> ${parsedTime.toISOString()} (${parsedTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)`);
    return parsedTime;
  }

  // Additional helper methods would go here...
}

export default new UnifiedFlightTracker();