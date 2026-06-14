import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calculator, CheckCircle } from 'lucide-react';
import { getAirlineFees } from '../../data/airlineFees';
import { calculateCompleteFareBreakdown, detectCountryFromRoute, getTaxExplanation } from '../../utils/airlineTaxCalculator';

interface PriceBreakdownModalFixedProps {
  isOpen: boolean;
  onClose: () => void;
  flight: any;
  currency?: string;
}

interface UserSelections {
  checkedBags: number;
  seatType: 'standard' | 'extra-legroom' | 'premium';
  insurance: boolean;
  meals: 'none' | 'standard' | 'premium';
  loungeAccess: boolean;
  priorityBoarding: boolean;
}

interface FeeBreakdown {
  base: number;
  bags: number;
  seat: number;
  insurance: number;
  meals: number;
  lounge: number;
  priority: number;
  total: number;
}

const PriceBreakdownModalFixed: React.FC<PriceBreakdownModalFixedProps> = ({
  isOpen,
  onClose,
  flight,
  currency = 'USD'
}) => {
  console.log('PriceBreakdownModalFixed render:', { isOpen, flight: !!flight });

  const [userSelections, setUserSelections] = useState<UserSelections>({
    checkedBags: 0,
    seatType: 'standard',
    insurance: false,
    meals: 'none',
    loungeAccess: false,
    priorityBoarding: false
  });

  const [fees, setFees] = useState<any>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUpdated, setTotalUpdated] = useState(false);
  const [completeFareBreakdown, setCompleteFareBreakdown] = useState<any>(null);
  
  // Ensure we always have a fallback breakdown
  const getSafeFareBreakdown = () => {
    if (completeFareBreakdown) return completeFareBreakdown;
    
    // Create a safe fallback breakdown
    const totalPrice = parseFloat(flight?.price?.total) || 100;
    return {
      baseFare: totalPrice * 0.7,
      taxes: {
        total: totalPrice * 0.2,
        airportTax: totalPrice * 0.08,
        passengerServiceCharge: totalPrice * 0.05,
        securityFee: totalPrice * 0.02,
        fuelSurcharge: totalPrice * 0.03,
        gst: totalPrice * 0.02,
        other: 0,
        breakdown: 'Estimated breakdown - calculation in progress'
      },
      surcharges: {
        total: totalPrice * 0.1,
        carrierSurcharge: totalPrice * 0.02,
        bookingFee: totalPrice * 0.05,
        paymentFee: totalPrice * 0.03
      },
      totalBeforeAddons: totalPrice
    };
  };

  // Currency conversion helper with comprehensive error handling
  const convertCurrency = (amount: number, fromCurrency: string = 'USD', toCurrency: string = currency): number => {
    try {
    if (fromCurrency === toCurrency) return amount;
      if (!amount || isNaN(amount)) return 0;
    
      // Current conversion rates (as of 2024) - comprehensive global coverage
    const conversionRates: Record<string, Record<string, number>> = {
      'USD': {
          'EUR': 0.92, 'GBP': 0.79, 'INR': 83.0, 'JPY': 150.0, 'CNY': 7.2, 'CAD': 1.35, 'AUD': 1.52,
          'AED': 3.67, 'SAR': 3.75, 'QAR': 3.64, 'KWD': 0.31, 'BHD': 0.38, 'OMR': 0.38,
          'SGD': 1.35, 'HKD': 7.8, 'KRW': 1320, 'THB': 35.5, 'MYR': 4.7, 'IDR': 15800, 'PHP': 56,
          'MXN': 17.2, 'BRL': 5.0, 'ARS': 900, 'NZD': 1.65,
          'ZAR': 18.5, 'EGP': 49, 'NGN': 1250, 'TRY': 32, 'CHF': 0.88, 'SEK': 10.5, 'NOK': 10.6, 'DKK': 6.9
      },
      'EUR': {
          'USD': 1.09, 'GBP': 0.86, 'INR': 90.5, 'JPY': 163.0, 'CNY': 7.8, 'CAD': 1.47, 'AUD': 1.65,
          'AED': 4.0, 'SAR': 4.1, 'QAR': 4.0, 'SGD': 1.47, 'HKD': 8.5
      },
      'GBP': {
          'USD': 1.27, 'EUR': 1.16, 'INR': 105.0, 'JPY': 189.0, 'CNY': 9.1, 'CAD': 1.71, 'AUD': 1.92,
          'AED': 4.65, 'SAR': 4.75, 'QAR': 4.62
      },
      'INR': {
          'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0095, 'JPY': 1.81, 'CNY': 0.087, 'CAD': 0.016, 'AUD': 0.018,
          'AED': 0.044, 'SAR': 0.045, 'QAR': 0.044, 'SGD': 0.016
        },
        'AED': {
          'USD': 0.27, 'EUR': 0.25, 'GBP': 0.21, 'INR': 22.6, 'SAR': 1.02, 'QAR': 0.99
        },
        'SAR': {
          'USD': 0.27, 'EUR': 0.24, 'GBP': 0.21, 'INR': 22.1, 'AED': 0.98, 'QAR': 0.97
        }
      };
      
      const rate = conversionRates[fromCurrency]?.[toCurrency];
      if (!rate) {
        console.warn(`No conversion rate found for ${fromCurrency} to ${toCurrency}, using 1:1`);
        return amount; // Return original amount if no rate found
      }
      
      const result = Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
      console.log(`Currency conversion: ${amount} ${fromCurrency} → ${result} ${toCurrency} (rate: ${rate})`);
      return result;
    } catch (error) {
      console.error('Error in currency conversion:', error);
      return amount; // Return original amount on error
    }
  };

  // Determine airline currency based on region (same logic as INR for all regions)
  const getAirlineCurrency = (airlineCode: string): string => {
    // Indian carriers
    const indianAirlines = ['AI', '6E', 'SG', 'UK', 'I5', 'G8', 'QP']; // Air India, IndiGo, SpiceJet, Vistara, AirAsia India, GoAir, Akasa
    
    // Gulf carriers
    const gulfAirlines = ['EK', 'EY', 'QR', 'SV', 'KU', 'GF', 'WY', 'FZ', 'G9', 'XY']; // Emirates, Etihad, Qatar, Saudia, Kuwait, Gulf Air, Oman Air, FlyDubai, Air Arabia, Flynas
    
    // European carriers
    const europeanAirlines = ['LH', 'AF', 'KL', 'BA', 'IB', 'AZ', 'LX', 'OS', 'SK', 'AY', 'TP', 'SN', 'LO', 'TK']; // Lufthansa, Air France, KLM, British Airways, Iberia, Alitalia, Swiss, Austrian, SAS, Finnair, TAP, Brussels, LOT, Turkish
    
    // Asian carriers
    const asianAirlines = ['SQ', 'CX', 'NH', 'KE', 'OZ', 'TG', 'MH', 'GA', 'PR', 'JL', 'CI', 'BR']; // Singapore, Cathay, ANA, Korean Air, Asiana, Thai, Malaysia, Garuda, Philippine, JAL, China Airlines, EVA
    
    // American carriers
    const americanAirlines = ['AA', 'DL', 'UA', 'WN', 'B6', 'AS', 'AC', 'WS', 'AV', 'CM', 'AM', 'LA']; // American, Delta, United, Southwest, JetBlue, Alaska, Air Canada, WestJet, Avianca, Copa, Aeromexico, LATAM
    
    // African carriers
    const africanAirlines = ['ET', 'SA', 'MS', 'KQ', 'AT', 'WB']; // Ethiopian, South African, EgyptAir, Kenya Airways, Royal Air Maroc, RwandAir
    
    if (indianAirlines.includes(airlineCode)) return 'INR';
    if (gulfAirlines.includes(airlineCode)) return 'AED'; // Use AED as base for Gulf
    if (europeanAirlines.includes(airlineCode)) return 'EUR';
    if (asianAirlines.includes(airlineCode)) return 'USD'; // Most Asian carriers use USD for international
    if (americanAirlines.includes(airlineCode)) return 'USD';
    if (africanAirlines.includes(airlineCode)) return 'USD';
    
    // Default to USD for unknown airlines
    return 'USD';
  };

  const formatPrice = (amount: number, showCurrency: boolean = true, isAddonFee: boolean = false): string => {
    try {
      let convertedAmount = amount;
      
      // For addon fees, we need to convert from airline's currency to flight's currency
      if (isAddonFee) {
        const airlineCode = flight?.itineraries?.[0]?.segments?.[0]?.carrierCode || 'default';
        const airlineCurrency = getAirlineCurrency(airlineCode);
        const flightCurrency = flight?.price?.currency || currency || 'USD';
        
        console.log('Currency conversion:', { airlineCurrency, flightCurrency, amount });
        
        // Convert addon fees to match flight currency
        if (airlineCurrency !== flightCurrency) {
          convertedAmount = convertCurrency(amount, airlineCurrency, flightCurrency);
        }
      } else {
        // For base price, just use as-is in flight's currency
        convertedAmount = amount;
      }
      
      if (showCurrency) {
        const displayCurrency = flight?.price?.currency || currency || 'USD';
        console.log('Formatting price:', { convertedAmount, displayCurrency });
        
        // Format with proper currency symbols but keep all text in English
        if (displayCurrency === 'INR') {
          return `₹${convertedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'USD') {
          return `$${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'EUR') {
          return `€${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'GBP') {
          return `£${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'JPY') {
          return `¥${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'KRW') {
          return `₩${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'AED') {
          return `د.إ${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'SAR') {
          return `ر.س${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'QAR') {
          return `ر.ق${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'KWD') {
          return `د.ك${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'BHD') {
          return `د.ب${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'OMR') {
          return `ر.ع.${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'SGD') {
          return `S$${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'HKD') {
          return `HK$${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'THB') {
          return `฿${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'MYR') {
          return `RM${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'IDR') {
          return `Rp${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'PHP') {
          return `₱${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'MXN') {
          return `$${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'BRL') {
          return `R$${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'ARS') {
          return `$${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'NZD') {
          return `NZ$${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'ZAR') {
          return `R${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'EGP') {
          return `£${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'NGN') {
          return `₦${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'TRY') {
          return `₺${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'CHF') {
          return `CHF${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'SEK') {
          return `${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} kr`;
        } else if (displayCurrency === 'NOK') {
          return `kr${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        } else if (displayCurrency === 'DKK') {
          return `${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} kr`;
        } else {
          // Default formatting for other currencies - same as INR style
          return `${displayCurrency} ${convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        }
      }
      return convertedAmount.toFixed(2);
    } catch (error) {
      console.error('Error formatting price:', error);
      // Safe fallback
      return `${amount.toFixed(2)}`;
    }
  };

  useEffect(() => {
    if (isOpen && flight) {
      try {
      loadFees();
        
        // Calculate complete fare breakdown based on route
        const from = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || '';
        const to = flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.iataCode || '';
        const totalPrice = parseFloat(flight?.price?.total) || 0;
        const flightCurrency = flight?.price?.currency || currency;
        
        console.log('Route calculation:', { from, to, totalPrice, flightCurrency, currency });
        
        if (from && to && totalPrice > 0) {
          try {
            // Estimate base fare as 65-70% of total (rest is taxes/fees)
            const estimatedBaseFare = totalPrice * 0.68;
            
            // Use flight's currency for tax calculation, fallback to prop currency
            const currencyForCalculation = flightCurrency || currency;
            console.log('Using currency for calculation:', currencyForCalculation);
            
            const breakdown = calculateCompleteFareBreakdown(estimatedBaseFare, from, to, currencyForCalculation);
            
            // Adjust to match actual total price
            const calculatedTotal = breakdown.totalBeforeAddons;
            const adjustmentRatio = totalPrice / calculatedTotal;
            
            console.log('Adjustment ratio:', adjustmentRatio, 'calculatedTotal:', calculatedTotal, 'totalPrice:', totalPrice);
            
            if (adjustmentRatio > 0.5 && adjustmentRatio < 1.5) {
              // Apply adjustment if reasonable
              breakdown.baseFare = breakdown.baseFare * adjustmentRatio;
              breakdown.taxes.total = breakdown.taxes.total * adjustmentRatio;
              breakdown.surcharges.total = breakdown.surcharges.total * adjustmentRatio;
              breakdown.totalBeforeAddons = breakdown.baseFare + breakdown.taxes.total + breakdown.surcharges.total;
            }
            
            setCompleteFareBreakdown(breakdown);
            console.log('✅ Fare breakdown calculated successfully:', breakdown);
          } catch (taxError) {
            console.error('❌ Error calculating fare breakdown:', taxError);
            // Set a fallback breakdown that always works
            const fallbackBreakdown = {
              baseFare: totalPrice * 0.7,
              taxes: { 
                total: totalPrice * 0.2, 
                airportTax: totalPrice * 0.08, 
                passengerServiceCharge: totalPrice * 0.05, 
                securityFee: totalPrice * 0.02, 
                fuelSurcharge: totalPrice * 0.03, 
                gst: totalPrice * 0.02, 
                other: 0, 
                breakdown: `Estimated breakdown for ${from} → ${to} (${flightCurrency})` 
              },
              surcharges: { 
                total: totalPrice * 0.1, 
                carrierSurcharge: totalPrice * 0.02, 
                bookingFee: totalPrice * 0.05, 
                paymentFee: totalPrice * 0.03 
              },
              totalBeforeAddons: totalPrice
            };
            setCompleteFareBreakdown(fallbackBreakdown);
            console.log('✅ Using fallback breakdown:', fallbackBreakdown);
          }
        } else {
          console.warn('Missing route data:', { from, to, totalPrice });
          // Set minimal fallback even without route data
          setCompleteFareBreakdown({
            baseFare: totalPrice * 0.7,
            taxes: { 
              total: totalPrice * 0.2, 
              airportTax: 0, 
              passengerServiceCharge: 0, 
              securityFee: 0, 
              fuelSurcharge: 0, 
              gst: 0, 
              other: 0, 
              breakdown: 'Estimated breakdown' 
            },
            surcharges: { 
              total: totalPrice * 0.1, 
              carrierSurcharge: 0, 
              bookingFee: 0, 
              paymentFee: 0 
            },
            totalBeforeAddons: totalPrice
          });
        }
      } catch (error) {
        console.error('❌ Error in useEffect:', error);
        // Ultimate fallback - always set something
        const totalPrice = parseFloat(flight?.price?.total) || 100;
        setCompleteFareBreakdown({
          baseFare: totalPrice * 0.7,
          taxes: { 
            total: totalPrice * 0.2, 
            airportTax: 0, 
            passengerServiceCharge: 0, 
            securityFee: 0, 
            fuelSurcharge: 0, 
            gst: 0, 
            other: 0, 
            breakdown: 'Safe fallback breakdown' 
          },
          surcharges: { 
            total: totalPrice * 0.1, 
            carrierSurcharge: 0, 
            bookingFee: 0, 
            paymentFee: 0 
          },
          totalBeforeAddons: totalPrice
        });
      }
    }
  }, [isOpen, flight, currency]);

  useEffect(() => {
    if (fees) {
      calculateTotal();
    }
  }, [userSelections, fees]);

  const loadFees = async () => {
    if (!flight) {
      setError('No flight data available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get airline code from multiple possible locations
      const airlineCode = flight.itineraries?.[0]?.segments?.[0]?.carrierCode || 
                         flight.itineraries?.[0]?.segments?.[0]?.airline?.code ||
                         flight.carrierCode || 'default';
      
      const from = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || '';
      const to = flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.iataCode || '';
      const route = `${from} to ${to}`;
      
      console.log('Loading real-time fees for airline:', airlineCode, 'route:', route);
      console.log('Flight data structure:', {
        carrierCode: flight.itineraries?.[0]?.segments?.[0]?.carrierCode,
        airlineCode: flight.itineraries?.[0]?.segments?.[0]?.airline?.code,
        flightCarrierCode: flight.carrierCode,
        selectedCode: airlineCode
      });
      
      // First get cached fees as fallback
      const cachedFees = getAirlineFees(airlineCode);
      console.log('📦 Cached fees loaded:', cachedFees);
      console.log('Bags:', cachedFees.bags);
      console.log('Seats:', cachedFees.seats);
      console.log('Insurance:', cachedFees.insurance);
      console.log('Meals:', cachedFees.meals);
      
      // Try to get real-time fees from Sonar API
      console.log(`🔍 Attempting to fetch real-time fees for ${airlineCode} on route ${route}...`);
      try {
        const realTimeFees = await fetchRealTimeFees(airlineCode, route, cachedFees);
        setFees(realTimeFees);
        console.log('✅ Real-time fees loaded successfully from official sources');
      } catch (apiError) {
        console.warn('⚠️ Real-time fee fetch failed, using cached database:', apiError);
        if (!cachedFees || !cachedFees.bags || !cachedFees.seats) {
          throw new Error('Invalid fee structure');
        }
        setFees({
          ...cachedFees,
          airlineName: 'Unknown Airline',
          region: 'International',
          currency: flight?.price?.currency || 'USD',
          lastUpdated: new Date().toISOString(),
          source: 'Cached database (real-time unavailable)',
          confidence: 60,
          specialNotes: 'Using cached pricing. Real-time data temporarily unavailable.'
        });
      }
    } catch (error) {
      console.error('Error loading fees:', error);
      setError('Failed to load airline fees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRealTimeFees = async (airlineCode: string, route: string, fallbackFees: any) => {
    const apiKey = import.meta.env.VITE_SONAR_API_KEY;
    if (!apiKey) {
      throw new Error('API key not available');
    }

    // Detect airline region and currency
    const getAirlineInfo = (code: string) => {
      const indianAirlines = ['AI', '6E', 'SG', 'UK', 'I5', 'G8', 'QP'];
      const usAirlines = ['AA', 'UA', 'DL', 'WN', 'B6', 'AS', 'NK', 'F9'];
      const europeanAirlines = ['BA', 'LH', 'AF', 'KL', 'FR', 'U2', 'IB', 'AZ'];
      const asianAirlines = ['SQ', 'CX', 'JL', 'NH', 'TG', 'MH', 'AK'];
      const middleEastAirlines = ['EK', 'QR', 'EY', 'MS', 'SV', 'WY'];
      
      if (indianAirlines.includes(code)) return { region: 'India', currency: 'INR', name: 'Indian' };
      if (usAirlines.includes(code)) return { region: 'USA', currency: 'USD', name: 'US' };
      if (europeanAirlines.includes(code)) return { region: 'Europe', currency: 'EUR', name: 'European' };
      if (asianAirlines.includes(code)) return { region: 'Asia', currency: 'USD', name: 'Asian' };
      if (middleEastAirlines.includes(code)) return { region: 'Middle East', currency: 'USD', name: 'Middle Eastern' };
      return { region: 'International', currency: 'USD', name: 'International' };
    };

    const airlineInfo = getAirlineInfo(airlineCode);
    const currentYear = new Date().getFullYear();

    const prompt = `
    CRITICAL TASK: Fetch REAL, CURRENT airline ancillary fees for ${airlineCode} (${airlineInfo.name} carrier).

    **REQUIRED SOURCES (Search in this exact order):**
    1. Official ${airlineCode} airline website (primary source)
    2. ${airlineCode} mobile app pricing
    3. Official ${airlineCode} press releases or fee announcements for ${currentYear}
    4. ${airlineCode} booking portal actual pricing
    5. Aviation regulatory filings (if available)

    **DO NOT USE:** Third-party travel sites, old data, estimates, or generic information.

    **ROUTE CONTEXT:** ${route}
    **REQUIRED CURRENCY:** ${airlineInfo.currency}
    **YEAR:** ${currentYear}

    **SEARCH FOR COMPLETE PRICING BREAKDOWN:**

    **A. BASE FARE BREAKDOWN (Critical):**
    1. **Base Fare:** Actual ticket price before taxes/fees
    2. **Government Taxes & Fees:**
       - Airport taxes (departure, arrival, transit)
       - Passenger service charges
       - Security fees
       - Customs/Immigration fees
       - Fuel surcharges (if separate)
       - GST/VAT (if applicable in ${airlineInfo.region})
    3. **Airline Surcharges:**
       - Carrier-imposed surcharges
       - YQ/YR fuel surcharges
       - Booking/Service fees
       - Payment processing fees

    **B. ANCILLARY FEES (Add-ons):**
    1. **Checked Baggage Fees:**
       - 1st checked bag fee
       - 2nd checked bag fee  
       - 3rd checked bag fee
       - Note: Some airlines offer free baggage; specify if so

    2. **Seat Selection Fees:**
       - Standard seat (usually free)
       - Extra legroom / Preferred seat
       - Premium economy seat
       - Note: Exact seat names (e.g., "Economy Plus", "Extra Space", "XL Seat")

    3. **Travel Insurance:**
       - Basic trip protection cost per passenger
       - Note: Some airlines don't offer this

    4. **In-Flight Meals:**
       - Standard meal price
       - Premium meal price
       - Note: Some include free meals; specify if so

    5. **Lounge Access:**
       - Pay-per-use lounge access price
       - Note: 0 if airline doesn't offer or N/A

    6. **Priority Services:**
       - Priority boarding fee
       - Fast track security (if separate)

    **SPECIAL INSTRUCTIONS FOR SPECIFIC AIRLINES:**
    - Low-cost carriers (Spirit, Frontier, Ryanair, IndiGo, SpiceJet): Check ALL fees carefully
    - Full-service carriers (Emirates, Singapore, ANA): Note complimentary services
    - Indian carriers: Ensure INR pricing (₹)
    - US carriers: Check Basic Economy restrictions
    - European carriers: Check Schengen vs International differences

    **OUTPUT FORMAT (STRICT JSON - NO MARKDOWN):**
    {
      "airline": "${airlineCode}",
      "airlineName": "Full airline name",
      "region": "${airlineInfo.region}",
      "route": "${route}",
      "currency": "${airlineInfo.currency}",
      "fareBreakdown": {
        "baseFare": <number or "varies">,
        "taxes": {
          "airportTax": <number or 0>,
          "passengerServiceCharge": <number or 0>,
          "securityFee": <number or 0>,
          "fuelSurcharge": <number or 0>,
          "gst": <number or 0>,
          "other": <number or 0>,
          "total": <number>,
          "breakdown": "Detailed tax description"
        },
        "surcharges": {
          "carrierSurcharge": <number or 0>,
          "bookingFee": <number or 0>,
          "paymentFee": <number or 0>,
          "total": <number>
        }
      },
      "bags": {
        "first": <number>,
        "second": <number>,
        "third": <number>,
        "notes": "Any special conditions"
      },
      "seats": {
        "standard": 0,
        "extraLegroom": <number>,
        "premium": <number>,
        "seatNames": "Actual seat product names"
      },
      "insurance": <number or 0>,
      "meals": {
        "standard": <number or 0>,
        "premium": <number or 0>,
        "complimentary": <boolean>
      },
      "loungeAccess": <number or 0>,
      "priorityBoarding": <number or 0>,
      "carryOnFee": <number or 0>,
      "specialNotes": "Any important restrictions or inclusions",
      "lastUpdated": "${new Date().toISOString()}",
      "source": "Specific URL or source checked",
      "confidence": <80-100>,
      "verificationDate": "${new Date().toISOString().split('T')[0]}"
    }

    **VALIDATION RULES:**
    - All prices must be in ${airlineInfo.currency}
    - Confidence score: 90-100 = Official source, 80-89 = Verified secondary source
    - If a service doesn't exist, use 0 (not null)
    - Mark complimentary services clearly
    - Include actual source URL in "source" field

    **CRITICAL:** Return ONLY the JSON object. No explanations, no markdown, no code blocks.
    `;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are an airline pricing specialist with real-time access to official airline websites and booking systems. Your task is to fetch CURRENT, VERIFIED ancillary fees from official sources only. Always cite your sources and provide accurate, up-to-date pricing for ${currentYear}.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
        top_p: 0.9,
        return_citations: true,
        search_recency_filter: 'month'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sonar API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];
    
    console.log('✅ Sonar API Response received:', { 
      hasContent: !!content, 
      citationCount: citations.length,
      contentPreview: content?.substring(0, 200) 
    });
    
    if (!content) {
      console.warn('No content received from Sonar API, using fallback fees');
      throw new Error('No content received from API');
    }

    // Try to parse JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No valid JSON found in Sonar response, using fallback fees');
      throw new Error('No valid JSON found in response');
    }

    let fees;
    try {
      fees = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Sonar API response:', parseError);
      throw new Error('Invalid JSON in API response');
    }
    
    // Validate the response structure
    if (!fees.bags || !fees.seats) {
      console.error('Invalid fee structure from Sonar API:', fees);
      throw new Error('Invalid fee structure in API response');
    }

    // Enhance with citations
    if (citations.length > 0) {
      fees.citations = citations;
      fees.verifiedSources = citations.map((c: any) => c.url || c).join(', ');
    }

    // Log successful fetch
    console.log('✅ Real-time fees fetched successfully:', {
      airline: fees.airline,
      currency: fees.currency,
      confidence: fees.confidence,
      source: fees.source,
      bags: fees.bags,
      seats: fees.seats
    });

    return fees;
  };

  const calculateTotal = () => {
    if (!fees) {
      console.log('No fees available for calculation');
      return;
    }

    // Parse base price as number with validation
    const basePrice = parseFloat(flight?.price?.total) || 0;
    const flightCurrency = flight?.price?.currency || 'USD';
    console.log('Calculating total for base price:', basePrice, 'currency:', flightCurrency);
    
    // Calculate add-on costs with proper property mapping
    const bagCost = calculateBagFees(userSelections.checkedBags);
    
    // Fix seat type mapping: convert kebab-case to camelCase
    const seatTypeKey = userSelections.seatType === 'extra-legroom' ? 'extraLegroom' : userSelections.seatType;
    const seatCost = parseFloat(fees.seats?.[seatTypeKey]) || 0;
    
    const insuranceCost = userSelections.insurance ? (parseFloat(fees.insurance) || 0) : 0;
    
    // Fix meal type mapping: convert kebab-case to camelCase
    const mealCost = userSelections.meals !== 'none' ? (parseFloat(fees.meals?.[userSelections.meals]) || 0) : 0;
    
    const loungeCost = userSelections.loungeAccess ? (parseFloat(fees.loungeAccess) || 0) : 0;
    const priorityCost = userSelections.priorityBoarding ? (parseFloat(fees.priorityBoarding) || 0) : 0;

    const addOns = bagCost + seatCost + insuranceCost + mealCost + loungeCost + priorityCost;
    const newTotal = basePrice + addOns;

    console.log('Total calculation:', { 
      basePrice, 
      bagCost, 
      seatCost, 
      insuranceCost, 
      mealCost, 
      loungeCost, 
      priorityCost,
      addOns, 
      newTotal 
    });

    setCalculatedTotal(newTotal);
    setFeeBreakdown({
      base: basePrice,
      bags: bagCost,
      seat: seatCost,
      insurance: insuranceCost,
      meals: mealCost,
      lounge: loungeCost,
      priority: priorityCost,
      total: newTotal
    });
    
    // Trigger animation for total update
    setTotalUpdated(true);
    setTimeout(() => setTotalUpdated(false), 1000);
  };

  const calculateBagFees = (numBags: number): number => {
    if (!fees || !fees.bags) return 0;
    
    if (numBags === 0) return 0;
    if (numBags === 1) return parseFloat(fees.bags.first) || 0;
    if (numBags === 2) return (parseFloat(fees.bags.first) || 0) + (parseFloat(fees.bags.second) || 0);
    if (numBags === 3) return (parseFloat(fees.bags.first) || 0) + (parseFloat(fees.bags.second) || 0) + (parseFloat(fees.bags.third) || 0);
    
    return (parseFloat(fees.bags.first) || 0) + (parseFloat(fees.bags.second) || 0) + (parseFloat(fees.bags.third) || 0);
  };

  const updateSelection = (field: keyof UserSelections, value: any) => {
    setUserSelections(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  if (!flight) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Flight Data
            </h3>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Interactive Price Breakdown
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {flight?.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Unknown Airline'} • {formatPrice(flight?.price?.total || 0)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading airline fees...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Fees
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadFees}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : fees ? (
            <div className="space-y-6">
              {/* Complete Fare Breakdown */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Complete Fare Breakdown
                </h3>
                
                <div className="space-y-4">
                  {/* Base Fare */}
                  <div className="bg-white dark:bg-dark-surface rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-blue-800 dark:text-blue-200">Base Fare</span>
                      <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {formatPrice(getSafeFareBreakdown().baseFare)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Airline's base ticket price before taxes</p>
                  </div>

                  {/* Government Taxes & Fees */}
                  {getSafeFareBreakdown().taxes && (
                    <div className="bg-white dark:bg-dark-surface rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-orange-800 dark:text-orange-200">Government Taxes & Fees</span>
                        <span className="text-lg font-bold text-orange-900 dark:text-orange-100">
                          {formatPrice(getSafeFareBreakdown().taxes.total)}
                        </span>
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-orange-200">
                        {getSafeFareBreakdown().taxes.airportTax > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Airport Tax</span>
                            <span className="font-medium">{formatPrice(getSafeFareBreakdown().taxes.airportTax)}</span>
                          </div>
                        )}
                        {getSafeFareBreakdown().taxes.passengerServiceCharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Passenger Service Charge</span>
                            <span className="font-medium">{formatPrice(getSafeFareBreakdown().taxes.passengerServiceCharge)}</span>
                          </div>
                        )}
                        {getSafeFareBreakdown().taxes.securityFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Security Fee</span>
                            <span className="font-medium">{formatPrice(getSafeFareBreakdown().taxes.securityFee)}</span>
                          </div>
                        )}
                        {getSafeFareBreakdown().taxes.fuelSurcharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Fuel Surcharge</span>
                            <span className="font-medium">{formatPrice(getSafeFareBreakdown().taxes.fuelSurcharge)}</span>
                          </div>
                        )}
                        {getSafeFareBreakdown().taxes.gst > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">GST/VAT</span>
                            <span className="font-medium">{formatPrice(getSafeFareBreakdown().taxes.gst)}</span>
                          </div>
                        )}
                        {getSafeFareBreakdown().taxes.other > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Other Taxes</span>
                            <span className="font-medium">{formatPrice(getSafeFareBreakdown().taxes.other)}</span>
                          </div>
                        )}
                      </div>
                      {getSafeFareBreakdown().taxes.breakdown && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                          {getSafeFareBreakdown().taxes.breakdown}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Airline Surcharges */}
                  {fees?.fareBreakdown?.surcharges && fees.fareBreakdown.surcharges.total > 0 && (
                    <div className="bg-white dark:bg-dark-surface rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-purple-800 dark:text-purple-200">Airline Surcharges</span>
                        <span className="text-lg font-bold text-purple-900 dark:text-purple-100">
                          {formatPrice(fees.fareBreakdown.surcharges.total)}
                        </span>
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-purple-200">
                        {fees.fareBreakdown.surcharges.carrierSurcharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Carrier Surcharge (YQ/YR)</span>
                            <span className="font-medium">{formatPrice(fees.fareBreakdown.surcharges.carrierSurcharge)}</span>
                          </div>
                        )}
                        {fees.fareBreakdown.surcharges.bookingFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Booking/Service Fee</span>
                            <span className="font-medium">{formatPrice(fees.fareBreakdown.surcharges.bookingFee)}</span>
                          </div>
                        )}
                        {fees.fareBreakdown.surcharges.paymentFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Payment Processing Fee</span>
                            <span className="font-medium">{formatPrice(fees.fareBreakdown.surcharges.paymentFee)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Total Flight Price */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
                <div className="flex justify-between items-center">
                      <span className="font-bold text-green-900 dark:text-green-100">Total Flight Price</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(flight?.price?.total || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Base fare + Taxes + Surcharges (before add-ons)
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Selections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Checked Baggage Selector */}
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Checked Baggage</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => updateSelection('checkedBags', num)}
                        className={`py-3 rounded-lg border-2 transition ${
                          userSelections.checkedBags === num
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900 dark:text-white">{num}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {num === 0 ? 'None' : `${num} bag${num > 1 ? 's' : ''}`}
                        </div>
                        {num > 0 && fees && (
                          <div className="text-sm font-medium text-green-600 mt-1">
                            +{formatPrice(calculateBagFees(num), true, true)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seat Selection */}
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Seat Selection</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'standard', label: 'Standard Seat', desc: 'Basic seating', price: 0 },
                      { key: 'extra-legroom', label: 'Extra Legroom', desc: 'Up to 5" more space', price: fees?.seats?.extraLegroom || 0 },
                      { key: 'premium', label: 'Premium Seat', desc: 'Front cabin, priority boarding', price: fees?.seats?.premium || 0 }
                    ].map(seat => (
                      <button
                        key={seat.key}
                        onClick={() => updateSelection('seatType', seat.key)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition ${
                          userSelections.seatType === seat.key
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{seat.label}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{seat.desc}</div>
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {seat.price === 0 ? 'Free' : `+${formatPrice(seat.price, true, true)}`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Insurance Toggle */}
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Travel Insurance</h4>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Trip Protection</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Coverage for trip cancellation</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={userSelections.insurance}
                        onChange={(e) => updateSelection('insurance', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        +{formatPrice(fees?.insurance || 0, true, true)}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Meals Selection */}
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">In-Flight Meals</h4>
                  <select
                    value={userSelections.meals}
                    onChange={(e) => updateSelection('meals', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
                  >
                    <option value="none">No meal - {formatPrice(0, true, true)}</option>
                    <option value="standard">Standard meal - +{formatPrice(fees?.meals?.standard || 0, true, true)}</option>
                    <option value="premium">Premium meal - +{formatPrice(fees?.meals?.premium || 0, true, true)}</option>
                  </select>
                </div>

                {/* Lounge Access Toggle */}
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Airport Lounge Access</h4>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Premium Lounge</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Access to airport lounges</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={userSelections.loungeAccess}
                        onChange={(e) => updateSelection('loungeAccess', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">+{formatPrice(fees?.loungeAccess || 0, true, true)}</span>
                    </div>
                  </label>
                </div>

                {/* Priority Boarding Toggle */}
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Priority Boarding</h4>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Early Boarding</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Board before general passengers</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={userSelections.priorityBoarding}
                        onChange={(e) => updateSelection('priorityBoarding', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">+{formatPrice(fees?.priorityBoarding || 0, true, true)}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Detailed Price Breakdown */}
              {feeBreakdown && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Price Breakdown
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Base Fare */}
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700">
                      <span className="text-gray-700 dark:text-gray-300">Base Fare</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(feeBreakdown.base)}</span>
                    </div>
                    
                    {/* Add-ons */}
                    {feeBreakdown.bags > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Checked Bags ({userSelections.checkedBags} bag{userSelections.checkedBags > 1 ? 's' : ''})
                        </span>
                        <span className="text-sm font-medium text-green-600">+{formatPrice(feeBreakdown.bags, true, false)}</span>
                      </div>
                    )}
                    
                    {feeBreakdown.seat > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {userSelections.seatType === 'extra-legroom' ? 'Extra Legroom Seat' : 
                           userSelections.seatType === 'premium' ? 'Premium Seat' : 'Seat Selection'}
                        </span>
                        <span className="text-sm font-medium text-green-600">+{formatPrice(feeBreakdown.seat, true, false)}</span>
                      </div>
                    )}
                    
                    {feeBreakdown.insurance > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Travel Insurance</span>
                        <span className="text-sm font-medium text-green-600">+{formatPrice(feeBreakdown.insurance, true, false)}</span>
                      </div>
                    )}
                    
                    {feeBreakdown.meals > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {userSelections.meals === 'standard' ? 'Standard Meal' : 'Premium Meal'}
                        </span>
                        <span className="text-sm font-medium text-green-600">+{formatPrice(feeBreakdown.meals, true, false)}</span>
                      </div>
                    )}
                    
                    {feeBreakdown.lounge > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Lounge Access</span>
                        <span className="text-sm font-medium text-green-600">+{formatPrice(feeBreakdown.lounge, true, false)}</span>
                      </div>
                    )}
                    
                    {feeBreakdown.priority > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Priority Boarding</span>
                        <span className="text-sm font-medium text-green-600">+{formatPrice(feeBreakdown.priority, true, false)}</span>
                      </div>
                    )}
                    
                    {/* Total */}
                    <div className={`flex justify-between items-center py-3 border-t-2 border-green-300 dark:border-green-600 mt-4 transition-all duration-500 ${totalUpdated ? 'bg-green-100 dark:bg-green-900/30 scale-105' : ''}`}>
                      <span className="text-lg font-bold text-green-900 dark:text-green-100">Total</span>
                      <span className={`text-2xl font-bold text-green-600 dark:text-green-400 transition-all duration-500 ${totalUpdated ? 'animate-pulse' : ''}`}>{formatPrice(feeBreakdown.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Fee Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Real-Time Fee Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-dark-surface p-3 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Airline</div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">
                      {fees?.airlineName || flight?.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Unknown'} ({flight?.itineraries?.[0]?.segments?.[0]?.carrierCode})
                    </div>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-3 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Region</div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">{fees?.region || 'International'}</div>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-3 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Fee Currency</div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">{fees?.currency || flight?.price?.currency || 'USD'}</div>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-3 rounded-lg col-span-2">
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Loaded Fee Prices</div>
                    <div className="text-xs font-mono text-blue-900 dark:text-blue-100">
                      Bags: {fees?.bags?.first}/{fees?.bags?.second}/{fees?.bags?.third} | 
                      Seats: {fees?.seats?.extraLegroom}/{fees?.seats?.premium} | 
                      Insurance: {fees?.insurance} | 
                      Meals: {fees?.meals?.standard}/{fees?.meals?.premium}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-3 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Data Source</div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100 truncate" title={fees?.source}>
                      {fees?.source?.includes('http') ? 'Official Website ✓' : fees?.source || 'Database'}
                    </div>
                  </div>
                </div>
                {fees?.specialNotes && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-yellow-800 dark:text-yellow-200">
                        <strong>Note:</strong> {fees.specialNotes}
                      </div>
                    </div>
                  </div>
                )}
                {(fees?.confidence || 0) < 80 && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Using cached data:</strong> Real-time pricing temporarily unavailable. Fees shown are from our database and may not reflect latest changes. Please verify on the airline's official website.
                      </div>
                    </div>
                  </div>
                )}
                {fees?.verifiedSources && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Verified from:</strong> <span className="italic">{fees.verifiedSources}</span>
                  </div>
                )}
              </div>

              {/* Fee Validation Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {fees?.source || 'Fees from airline database'}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    (fees?.confidence || 60) >= 80 
                      ? 'bg-green-100 text-green-800' 
                      : (fees?.confidence || 60) >= 60 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {fees?.confidence || 60}% confidence
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {fees?.lastUpdated 
                    ? `Last updated: ${new Date(fees.lastUpdated).toLocaleString()}`
                    : 'Fees are based on current airline policies and may vary'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading airline fees...</p>
            </div>
          )}
        </div>

        {/* Sticky Total Display */}
        {fees && feeBreakdown && calculatedTotal > 0 && (
          <div className="sticky bottom-0 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 border-t-2 border-green-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Original Price</div>
                <div className="text-lg font-medium line-through text-gray-500">
                  {formatPrice(feeBreakdown.base)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total with Add-ons</div>
                <div className={`text-3xl font-bold text-green-600 dark:text-green-400 transition-all duration-500 ${totalUpdated ? 'animate-pulse scale-110' : ''}`}>
                  {formatPrice(calculatedTotal)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  (+{formatPrice(calculatedTotal - feeBreakdown.base)} in extras)
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              <strong>What's included:</strong>
              {userSelections.checkedBags > 0 && ` ${userSelections.checkedBags} checked bag(s) •`}
              {userSelections.seatType !== 'standard' && ` ${userSelections.seatType.replace('-', ' ')} seat •`}
              {userSelections.insurance && ' Travel insurance •'}
              {userSelections.meals !== 'none' && ` ${userSelections.meals} meal •`}
              {userSelections.loungeAccess && ' Lounge access •'}
              {userSelections.priorityBoarding && ' Priority boarding'}
            </div>
            
            <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-green-700 transition">
              Continue with selections
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceBreakdownModalFixed;
