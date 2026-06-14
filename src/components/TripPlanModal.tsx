import React, { useState, useEffect } from 'react';
import {
  X, MapPin, Calendar, DollarSign, Globe, Sparkles, 
  Plane, Hotel, Utensils, Car, Info, Star, Map, Printer,
  FileText, CheckCircle, Plus, Loader2, Users, Train, Bus
} from 'lucide-react';
import LeafletTripMap from './LeafletTripMap';
import FlightPriceGraph from './FlightPriceGraph';
import AlternativeHotels from './AlternativeHotels';
import { tripService } from '../services/tripService';
import aiTripPlanningService from '@/services/aiTripPlanningService';
import { useAuthSafe } from '../contexts/AppwriteAuthContext';
import toast from 'react-hot-toast';


interface TripPlan {
  destination?: string | {
    name?: string;
    country?: string;
    overview?: string;
    highlights?: string[];
    bestTimeToVisit?: string;
    timeZone?: string;
    language?: string;
    currency?: string;
  };
  duration?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  travelers?: string;
  numberOfTravelers?: number;
  fullResponse?: string;
  flights?: {
    outbound?: {
      airline?: string;
      flightNumber?: string;
      route?: string;
      departure?: string;
      arrival?: string;
      duration?: string;
      price?: string;
      class?: string;
      bookingUrl?: string;
      connections?: string;
      layoverTime?: string;
      aircraft?: string;
      baggage?: string;
      priceRange?: {
        low?: number;
        high?: number;
        average?: number;
      };
    };
    return?: {
      airline?: string;
      flightNumber?: string;
      route?: string;
      departure?: string;
      arrival?: string;
      duration?: string;
      price?: string;
      class?: string;
      bookingUrl?: string;
      connections?: string;
      layoverTime?: string;
      aircraft?: string;
      baggage?: string;
      priceRange?: {
        low?: number;
        high?: number;
        average?: number;
      };
    };
    totalFlightCost?: string;
    priceAnalysis?: {
      bestTimeToBook?: string;
      priceTrend?: string;
      savingsTip?: string;
    };
  };
  accommodation?: {
    primary?: {
      name?: string;
      type?: string;
      location?: string;
      pricePerNight?: string;
      totalPrice?: string;
      amenities?: string[];
      rating?: string;
      address?: string;
      checkIn?: string;
      checkOut?: string;
      cancellationPolicy?: string;
    };
    alternatives?: Array<{
      name?: string;
      type?: string;
      location?: string;
      pricePerNight?: string;
      totalPrice?: string;
      rating?: string;
      amenities?: string[];
      bookingUrl?: string;
      whyRecommended?: string;
    }>;
  };
  itinerary?: Array<{
    day?: number;
    title?: string;
    activities?: Array<{
      time?: string;
      activity?: string;
      location?: string;
      duration?: string;
      cost?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
      address?: string;
    }>;
  }>;
  foodGuide?: {
    mustTryDishes?: string[];
    recommendedRestaurants?: Array<{
      name?: string;
      cuisine?: string;
      priceRange?: string;
      specialty?: string;
    }>;
    foodBudget?: string;
    averageMealCost?: string;
  };
  transportation?: {
    fromAirport?: string;
    localTransport?: string;
    recommendedApps?: string[];
    walkability?: string;
    tips?: string[];
    train?: {
      outbound?: {
        trainName?: string;
        route?: string;
        departure?: string;
        arrival?: string;
        duration?: string;
        price?: string;
      };
      return?: {
        trainName?: string;
        route?: string;
        departure?: string;
        arrival?: string;
        duration?: string;
        price?: string;
      };
    };
    bus?: {
      outbound?: {
        operator?: string;
        route?: string;
        departure?: string;
        arrival?: string;
        duration?: string;
        price?: string;
      };
      return?: {
        operator?: string;
        route?: string;
        departure?: string;
        arrival?: string;
        duration?: string;
        price?: string;
      };
    };
  };
  visaInfo?: {
    required?: boolean;
    type?: string;
    duration?: string;
    cost?: string;
    requirements?: string[];
    processingTime?: string;
    passportSpecificNotes?: string;
    onlineApplication?: boolean;
    visaOnArrival?: boolean;
    embassyLocation?: string;
    applicationUrl?: string;
    importantNotes?: string[];
    visaPageReference?: string;
  };
  costBreakdown?: {
    flights?: string;
    accommodation?: string;
    food?: string;
    activities?: string;
    transportation?: string;
    visaAndFees?: string;
    miscellaneous?: string;
    total?: string;
    dailyBudget?: string;
    exchangeRate?: string;
    lastUpdated?: string;
  };
  insiderTips?: string[];
  packing?: {
    essentials?: string[];
    seasonal?: string[];
    culturalConsiderations?: string[];
  };
  quickActions?: string[];
}

interface TripPlanModalProps {
  tripPlan: TripPlan;
  onClose: () => void;
  userPassportCountry?: string;
  userPreferredCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  onTripCreated?: (tripId: string) => void;
}

const TripPlanModal: React.FC<TripPlanModalProps> = ({ 
  tripPlan, 
  onClose, 
  userPassportCountry = 'US',
  userPreferredCurrency = 'USD',
  onCurrencyChange,
  onTripCreated
}) => {
  // Debug logging
  const [activeTab, setActiveTab] = useState('overview');
  const [isClosing, setIsClosing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintSuccess, setShowPrintSuccess] = useState(false);
  const [showCurrencyEdit, setShowCurrencyEdit] = useState(false);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [tempCurrency, setTempCurrency] = useState(userPreferredCurrency);
  const [customCurrency, setCustomCurrency] = useState('');
  
  const authContext = useAuthSafe();
  const user = authContext?.user;

  // Currency options
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
  ];

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    
    // Extract numeric value from price string
    const numericValue = parseFloat(price.replace(/[^\d.-]/g, ''));
    if (isNaN(numericValue)) return price;
    
    // Use the centralized currency utility for proper formatting
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: userPreferredCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue);
    } catch (error) {
      // Fallback for custom currencies
      const symbol = getCurrencySymbol(userPreferredCurrency);
      return `${symbol} ${numericValue.toFixed(2)}`;
    }
  };

  // Utility function to extract numeric value from price strings
  const extractNumericValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      let cleaned = value.toString();
      
      // Convert lakhs to standard numbers (1 lakh = 100,000)
      cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*lakhs?/gi, (_, num) => {
        const val = parseFloat(num) * 100000;
        return val.toString();
      });
      
      // Convert crores to standard numbers (1 crore = 10,000,000)
      cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*crores?/gi, (_, num) => {
        const val = parseFloat(num) * 10000000;
        return val.toString();
      });
      
      // Convert thousands to standard numbers
      cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*thousands?/gi, (_, num) => {
        const val = parseFloat(num) * 1000;
        return val.toString();
      });
      
      // Extract numeric value (including commas and decimals)
      const match = cleaned.match(/[\d,]+\.?\d*/);
      const result = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
      
      // Additional validation for hotel prices (should be reasonable)
      if (result > 1000000) { // More than 10 lakhs

        // Try to extract a more reasonable value by looking for patterns
        const reasonableMatch = value.match(/(\d{1,2})[,\d]*\.?\d*/);
        if (reasonableMatch) {
          const reasonableValue = parseFloat(reasonableMatch[1]) * 1000; // Assume it's in thousands

          return reasonableValue;
        }
      }
      
      return result;
    }
    return 0;
  };

  const handleCurrencyUpdate = () => {
    if (onCurrencyChange) {
      onCurrencyChange(tempCurrency);
    }
    setShowCurrencyEdit(false);
  };

  const handleOneClickTripCreation = async () => {
    if (!user) {
      toast.error('Please log in to create a trip');
      return;
    }

    setIsCreatingTrip(true);
    try {
      // Extract trip details from the trip plan
      const destinationName = getDestinationName();
      const destinationCountry = getDestinationCountry();
      
      // Calculate trip duration and extract number of days
      let duration = 'Unknown';
      let numberOfDays = 7; // Default fallback
      
      if (tripPlan.duration) {
        duration = tripPlan.duration;
        // Extract number of days from duration string (e.g., "5 days" -> 5)
        const daysMatch = tripPlan.duration.match(/(\d+)\s*day/i);
        if (daysMatch) {
          numberOfDays = parseInt(daysMatch[1]);
        }
      } else if (tripPlan.itinerary && tripPlan.itinerary.length > 0) {
        numberOfDays = tripPlan.itinerary.length;
        duration = `${numberOfDays} days`;
      }

      // Extract dates from trip plan if available
      let startDate: string;
      let endDate: string;
      
      if (tripPlan.startDate && tripPlan.endDate) {
        // Use dates from AI trip plan if provided
        startDate = tripPlan.startDate;
        endDate = tripPlan.endDate;

      } else {
        // Calculate dates based on duration
        startDate = new Date().toISOString().split('T')[0];
        endDate = new Date(Date.now() + (numberOfDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      }

      // Extract number of travelers
      const memberCountRaw = tripPlan.travelers || tripPlan.numberOfTravelers || 1;
      let memberCount: number;
      if (typeof memberCountRaw === 'string') {
        // Extract number from strings like "2 people", "1 person", etc.
        const numberMatch = memberCountRaw.match(/(\d+)/);
        memberCount = numberMatch ? parseInt(numberMatch[1]) : 1;
      } else {
        memberCount = memberCountRaw;
      }
      const isGroupTrip = memberCount > 1;
      


      // Extract budget information using enhanced method
      let budget: number | undefined;
      
      try {
        const budgetInfo = aiTripPlanningService.extractBudgetFromTripPlan(tripPlan, userPreferredCurrency);
        if (budgetInfo) {
          budget = budgetInfo.totalBudget;

        } else {
          // Fallback to old method
          if (tripPlan.costBreakdown?.total) {
            const budgetMatch = tripPlan.costBreakdown.total.match(/[\d,]+/);
            if (budgetMatch) {
              budget = parseInt(budgetMatch[0].replace(/,/g, ''));
            }
          } else if (tripPlan.budget) {
            const budgetMatch = tripPlan.budget.match(/[\d,]+/);
            if (budgetMatch) {
              budget = parseInt(budgetMatch[0].replace(/,/g, ''));
            }
          }
        }
      } catch (error) {

        // Fallback to old method
        if (tripPlan.costBreakdown?.total) {
          const budgetMatch = tripPlan.costBreakdown.total.match(/[\d,]+/);
          if (budgetMatch) {
            budget = parseInt(budgetMatch[0].replace(/,/g, ''));
          }
        }
      }

      // Create trip data
      const tripData = {
        title: `${destinationName} Trip`,
        destination: destinationName,
        startDate,
        endDate,
        budget,
        // Note: currency field removed as it's not in the database schema
        status: 'planning' as const,
        memberCount,
        isGroupTrip,
        description: typeof tripPlan.destination === 'object' && tripPlan.destination.overview 
          ? tripPlan.destination.overview 
          : `AI-generated trip plan for ${destinationName}${destinationCountry ? `, ${destinationCountry}` : ''}. ${duration} adventure with detailed itinerary, accommodation, and cost breakdown.`,
        ownerId: user.$id
      };




      // Create the trip
      const { trip } = await tripService.createTripWithOwner(tripData, {
        userId: user.$id,
        email: user.email,
        name: user.name || 'Anonymous User'
      });

      // Create activities from itinerary (batch creation for speed)

      if (tripPlan.itinerary && tripPlan.itinerary.length > 0) {
        const activitiesToCreate = [];
        
        for (const day of tripPlan.itinerary) {
          if (day.activities && day.activities.length > 0) {

            for (const activity of day.activities) {
              // Build enhanced description with coordinates if available
              let description = '';
              if (activity.location) {
                description += `Location: ${activity.location}`;
                if (activity.coordinates) {
                  description += `\nCoordinates: ${activity.coordinates.lat}, ${activity.coordinates.lng}`;
                }
                if (activity.address) {
                  description += `\nAddress: ${activity.address}`;
                }
              }

              // Extract cost more robustly
              let activityCost = 0;
              if (activity.cost) {
                // Try to extract number from cost string (handle various formats)
                const costMatch = activity.cost.toString().match(/[\d,]+\.?\d*/);
                if (costMatch) {
                  activityCost = parseFloat(costMatch[0].replace(/,/g, ''));
                }
              }

              // Calculate activity date properly
              const tripStartDate = new Date(startDate);
              const activityDate = new Date(tripStartDate.getTime() + ((day.day || 1) - 1) * 24 * 60 * 60 * 1000);
              
              const activityData = {
                tripId: trip.$id!,
                title: activity.activity || 'Activity',
                description: description || undefined,
                category: 'activity' as const,
                date: activityDate.toISOString(),
                time: activity.time,
                location: activity.location,
                cost: activityCost > 0 ? activityCost : undefined,
                status: 'pending' as const,
                addedBy: user.$id,
                duration: activity.duration
                // Note: aiGenerated field removed as it's not in the database schema
              };
              
              
              activitiesToCreate.push(activityData);
            }
          }
        }
        
        // Batch create all activities at once for speed
        if (activitiesToCreate.length > 0) {




          try {
            // Create activities in parallel batches of 5 to avoid overwhelming the API
            const batchSize = 5;
            const createdActivities = [];
            for (let i = 0; i < activitiesToCreate.length; i += batchSize) {
              const batch = activitiesToCreate.slice(i, i + batchSize);
              const batchResults = await Promise.all(batch.map(activityData => {

                return tripService.createActivity(activityData);
              }));
              createdActivities.push(...batchResults);

            }

            
            // Activities created successfully
          } catch (error) {

            // Fallback: create activities one by one if batch fails

            for (const activityData of activitiesToCreate) {
              try {
                await tripService.createActivity(activityData);
              } catch (individualError) {
                // Continue with other activities if one fails
              }
            }
          }
        } else {


        }
      }

      // NOTE: Checklist generation removed - users can manually add checklist items in the Checklist tab


      // Call the callback if provided (this will show the success toast)
      if (onTripCreated) {
        onTripCreated(trip.$id!);
      }

      // Close the modal
      handleClose();

    } catch (error) {

      toast.error('Failed to create trip. Please try again.');
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleClose = () => {

    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);

      
      const printContent = generatePrintHTML();
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup blockers.');
      }

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      const handlePrintLoad = () => {
        setTimeout(() => {
          try {
            printWindow.print();
            printWindow.close();
            setShowPrintSuccess(true);
            setTimeout(() => setShowPrintSuccess(false), 3000);
          } catch (printError) {

            printWindow.close();
          }
        }, 500);
      };

      if (printWindow.document.readyState === 'complete') {
        handlePrintLoad();
      } else {
        printWindow.onload = handlePrintLoad;
      }


    } catch (error) {

      alert('Failed to print. Please try again or check your popup blocker settings.');
    } finally {
      setTimeout(() => setIsPrinting(false), 1000);
    }
  };

  // Handle escape key for closing modal and Ctrl+P for printing
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePrintHTML = (): string => {
    const destinationName = getDestinationName();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${destinationName} - Complete Trip Plan</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #2d3748; 
            background: white;
            font-size: 12px;
          }
          
          .print-container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: white;
          }
          
          .print-header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          
          .print-header h1 { 
            font-size: 28px; 
            margin-bottom: 10px; 
            font-weight: 700;
          }
          
          .print-header .subtitle { 
            font-size: 16px; 
            opacity: 0.9;
            margin-bottom: 10px;
          }
          
          .print-meta { 
            font-size: 14px; 
            opacity: 0.8;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          
          .section { 
            margin-bottom: 25px; 
            page-break-inside: avoid;
          }
          
          .section-title { 
            font-size: 18px; 
            font-weight: 700; 
            color: #2d3748;
            margin-bottom: 15px; 
            padding: 10px 15px;
            background: linear-gradient(90deg, #f7fafc 0%, #edf2f7 100%);
            border-left: 4px solid #667eea;
            border-radius: 5px;
          }
          
          .subsection { 
            margin-bottom: 15px; 
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          
          .subsection-title { 
            font-size: 14px; 
            font-weight: 600; 
            margin-bottom: 10px; 
            color: #495057;
          }
          
          .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 10px; 
            margin: 10px 0;
          }
          
          .info-item { 
            padding: 8px 12px; 
            background: white; 
            border-radius: 5px; 
            border: 1px solid #dee2e6;
          }
          
          .info-label { 
            font-weight: 600; 
            color: #6c757d; 
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-value { 
            color: #2d3748; 
            font-weight: 500;
            margin-top: 2px;
          }
          
          .cost-breakdown { 
            background: #e8f5e8; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #c3e6c3;
          }
          
          .cost-item { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 5px 0;
            border-bottom: 1px solid #d4e6d4;
          }
          
          .cost-total { 
            font-weight: 700; 
            font-size: 16px; 
            color: #2d3748;
            border-top: 2px solid #667eea;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .activity-day { 
            background: #fff; 
            border: 1px solid #e9ecef; 
            border-radius: 8px; 
            margin-bottom: 15px; 
            overflow: hidden;
          }
          
          .day-header { 
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 10px 15px; 
            font-weight: 600;
          }
          
          .activity-item { 
            padding: 12px 15px; 
            border-bottom: 1px solid #f1f3f4;
            display: flex;
            gap: 15px;
          }
          
          .activity-time { 
            background: #667eea; 
            color: white; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: 600;
            min-width: 60px;
            text-align: center;
          }
          
          .activity-details { 
            flex: 1;
          }
          
          .activity-name { 
            font-weight: 600; 
            color: #2d3748; 
            margin-bottom: 4px;
          }
          
          .activity-meta { 
            font-size: 11px; 
            color: #6c757d;
          }
          
          .tips-list { 
            background: #fff3cd; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #ffeaa7;
          }
          
          .tip-item { 
            margin-bottom: 8px; 
            padding-left: 15px; 
            position: relative;
          }
          
          .tip-item::before { 
            content: "💡"; 
            position: absolute; 
            left: 0;
          }
          
          .restaurant-item { 
            background: #fff; 
            border: 1px solid #e9ecef; 
            border-radius: 6px; 
            padding: 10px; 
            margin-bottom: 8px;
          }
          
          .restaurant-name { 
            font-weight: 600; 
            color: #2d3748;
          }
          
          .restaurant-details { 
            font-size: 11px; 
            color: #6c757d; 
            margin-top: 3px;
          }
          
          .print-footer { 
            text-align: center; 
            margin-top: 30px; 
            padding: 20px; 
            background: #f8f9fa; 
            border-radius: 8px;
            font-size: 11px; 
            color: #6c757d;
          }
          
          .country-note {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 6px;
            padding: 10px;
            margin: 10px 0;
            font-size: 11px;
          }

          @media print {
            body { font-size: 11px; }
            .print-container { padding: 10px; }
            .section { page-break-inside: avoid; }
            .activity-day { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${generatePrintContent()}
        </div>
      </body>
      </html>
    `;
  };

  const generatePrintContent = (): string => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const destinationName = getDestinationName();
    const destinationCountry = getDestinationCountry();

    let content = `
      <div class="print-header">
        <h1>🗺️ ${destinationName} Trip Plan</h1>
        <div class="subtitle">Complete Travel Guide & Itinerary</div>
        <div class="print-meta">
          <span>📅 Generated: ${currentDate}</span>
          ${destinationCountry ? `<span>🌍 Destination: ${destinationCountry}</span>` : ''}
          ${userPassportCountry ? `<span>🛂 Passport Country: ${userPassportCountry}</span>` : ''}
          ${tripPlan.duration ? `<span>⏱️ Duration: ${tripPlan.duration}</span>` : ''}
        </div>
      </div>

      <div class="country-note">
        <strong>💰 Cost Information:</strong> All prices and costs are estimated based on ${userPassportCountry} passport holder rates and current exchange rates as of ${currentDate}. Actual costs may vary based on booking timing, seasonal fluctuations, and personal preferences.
      </div>
    `;

    // Destination Overview
    if (typeof tripPlan.destination === 'object' && tripPlan.destination.overview) {
      content += `
        <div class="section">
          <div class="section-title">🏙️ Destination Overview</div>
          <div class="subsection">
            <p>${tripPlan.destination.overview}</p>
            ${tripPlan.destination.highlights && tripPlan.destination.highlights.length > 0 ? `
              <div style="margin-top: 15px;">
                <strong>Top Highlights:</strong>
                <ul style="margin-left: 20px; margin-top: 5px;">
                  ${tripPlan.destination.highlights.map(highlight => `<li style="margin-bottom: 5px;">${highlight}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Essential Information
    if (typeof tripPlan.destination === 'object') {
      const dest = tripPlan.destination;
      if (dest.timeZone || dest.language || dest.currency || dest.bestTimeToVisit) {
        content += `
          <div class="section">
            <div class="section-title">ℹ️ Essential Information</div>
            <div class="info-grid">
              ${dest.timeZone ? `
                <div class="info-item">
                  <div class="info-label">Time Zone</div>
                  <div class="info-value">${dest.timeZone}</div>
                </div>
              ` : ''}
              ${dest.language ? `
                <div class="info-item">
                  <div class="info-label">Language</div>
                  <div class="info-value">${dest.language}</div>
                </div>
              ` : ''}
              ${dest.currency ? `
                <div class="info-item">
                  <div class="info-label">Currency</div>
                  <div class="info-value">${dest.currency}</div>
                </div>
              ` : ''}
              ${dest.bestTimeToVisit ? `
                <div class="info-item">
                  <div class="info-label">Best Time to Visit</div>
                  <div class="info-value">${dest.bestTimeToVisit}</div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }
    }

    // Flight Information
    if (tripPlan.flights) {
      content += `
        <div class="section">
          <div class="section-title">✈️ Flight Details</div>
          ${tripPlan.flights.outbound ? `
            <div class="subsection">
              <div class="subsection-title">🛫 Outbound Flight</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Airline & Flight</div>
                  <div class="info-value">${tripPlan.flights.outbound.airline} ${tripPlan.flights.outbound.flightNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Route</div>
                  <div class="info-value">${tripPlan.flights.outbound.route}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Departure</div>
                  <div class="info-value">${tripPlan.flights.outbound.departure}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Arrival</div>
                  <div class="info-value">${tripPlan.flights.outbound.arrival}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Duration</div>
                  <div class="info-value">${tripPlan.flights.outbound.duration}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Price</div>
                  <div class="info-value">${formatPrice(tripPlan.flights.outbound.price || '0')}</div>
                </div>
              </div>
            </div>
          ` : ''}
          ${tripPlan.flights.return ? `
            <div class="subsection">
              <div class="subsection-title">🛬 Return Flight</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Airline & Flight</div>
                  <div class="info-value">${tripPlan.flights.return.airline} ${tripPlan.flights.return.flightNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Route</div>
                  <div class="info-value">${tripPlan.flights.return.route}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Departure</div>
                  <div class="info-value">${tripPlan.flights.return.departure}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Arrival</div>
                  <div class="info-value">${tripPlan.flights.return.arrival}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Duration</div>
                  <div class="info-value">${tripPlan.flights.return.duration}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Price</div>
                  <div class="info-value">${formatPrice(tripPlan.flights.return.price || '0')}</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Accommodation
    if (tripPlan.accommodation) {
      content += `
        <div class="section">
          <div class="section-title">🏨 Accommodation</div>
          <div class="subsection">
            <div class="subsection-title">${tripPlan.accommodation.primary?.name || 'Accommodation'}</div>
            <div class="info-grid">
              ${tripPlan.accommodation.primary?.type ? `
                <div class="info-item">
                  <div class="info-label">Type</div>
                  <div class="info-value">${tripPlan.accommodation.primary.type}</div>
                </div>
              ` : ''}
              ${tripPlan.accommodation.primary?.location ? `
                <div class="info-item">
                  <div class="info-label">Location</div>
                  <div class="info-value">${tripPlan.accommodation.primary.location}</div>
                </div>
              ` : ''}
              ${tripPlan.accommodation.primary?.rating ? `
                <div class="info-item">
                  <div class="info-label">Rating</div>
                  <div class="info-value">⭐ ${tripPlan.accommodation.primary.rating}</div>
                </div>
              ` : ''}
              ${tripPlan.accommodation.primary?.pricePerNight ? `
                <div class="info-item">
                  <div class="info-label">Price per Night</div>
                  <div class="info-value">${formatPrice(tripPlan.accommodation.primary.pricePerNight)}</div>
                </div>
              ` : ''}
              ${tripPlan.accommodation.primary?.pricePerNight && tripPlan.duration ? `
                <div class="info-item">
                  <div class="info-label">Total Price</div>
                  <div class="info-value">${(() => {
                    try {
                      const travelers = tripPlan.travelers || tripPlan.numberOfTravelers || 1;
                      const travelerCount = typeof travelers === 'string' ? (parseInt((travelers.match(/(\d+)/) || [,'1'])[1]) || 1) : travelers;
                      const roomsNeeded = Math.ceil(travelerCount / 2);
                      const isPerPerson = (tripPlan.accommodation.primary.pricePerNight || '').toLowerCase().includes('per person') ||
                                         (tripPlan.accommodation.primary.pricePerNight || '').toLowerCase().includes('pp');
                      const pricePerNight = extractNumericValue(tripPlan.accommodation.primary.pricePerNight || '0');
                      const nights = parseInt((tripPlan.duration.match(/(\d+)/) || [,'1'])[1]) || 1;
                      const expectedTotal = isPerPerson ? pricePerNight * nights * travelerCount : pricePerNight * nights * roomsNeeded;
                      return formatPrice(String(expectedTotal));
                    } catch (_) {
                      return formatPrice(tripPlan.accommodation.primary.totalPrice || '');
                    }
                  })()}</div>
                </div>
              ` : ''}
            </div>
            ${tripPlan.accommodation.primary?.amenities && tripPlan.accommodation.primary.amenities.length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Amenities:</strong> ${tripPlan.accommodation.primary.amenities.join(', ')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Itinerary
    if (tripPlan.itinerary && tripPlan.itinerary.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">📅 Day-by-Day Itinerary</div>
          ${tripPlan.itinerary.map(day => `
            <div class="activity-day">
              <div class="day-header">
                Day ${day.day}: ${day.title}
              </div>
              ${day.activities && day.activities.length > 0 ? 
                day.activities.map(activity => `
                  <div class="activity-item">
                    <div class="activity-time">${activity.time}</div>
                    <div class="activity-details">
                      <div class="activity-name">${activity.activity}</div>
                      <div class="activity-meta">
                        ${activity.location ? `📍 ${activity.location}` : ''}
                        ${activity.duration ? ` • ⏱️ ${activity.duration}` : ''}
                        ${activity.cost ? ` • 💰 ${activity.cost}` : ''}
                      </div>
                    </div>
                  </div>
                `).join('') : 
                '<div class="activity-item">No activities planned for this day</div>'
              }
            </div>
          `).join('')}
        </div>
      `;
    }

    // Food Guide
    if (tripPlan.foodGuide) {
      content += `
        <div class="section">
          <div class="section-title">🍽️ Food & Dining Guide</div>
          ${tripPlan.foodGuide.mustTryDishes && tripPlan.foodGuide.mustTryDishes.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">Must-Try Dishes</div>
              <ul style="margin-left: 20px;">
                ${tripPlan.foodGuide.mustTryDishes.map(dish => `<li style="margin-bottom: 5px;">${dish}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${tripPlan.foodGuide.recommendedRestaurants && tripPlan.foodGuide.recommendedRestaurants.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">Recommended Restaurants</div>
              ${tripPlan.foodGuide.recommendedRestaurants.map(restaurant => `
                <div class="restaurant-item">
                  <div class="restaurant-name">${restaurant.name}</div>
                  <div class="restaurant-details">
                    ${restaurant.cuisine ? `🍽️ ${restaurant.cuisine}` : ''}
                    ${restaurant.priceRange ? ` • 💰 ${restaurant.priceRange}` : ''}
                    ${restaurant.specialty ? ` • ⭐ ${restaurant.specialty}` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${tripPlan.foodGuide.foodBudget || tripPlan.foodGuide.averageMealCost ? `
            <div class="subsection">
              <div class="subsection-title">Food Budget</div>
              <div class="info-grid">
                ${tripPlan.foodGuide.averageMealCost ? `
                  <div class="info-item">
                    <div class="info-label">Average Meal Cost</div>
                    <div class="info-value">${formatPrice(tripPlan.foodGuide.averageMealCost)}</div>
                  </div>
                ` : ''}
                ${tripPlan.foodGuide.foodBudget ? `
                  <div class="info-item">
                    <div class="info-label">Total Food Budget</div>
                    <div class="info-value">${formatPrice(tripPlan.foodGuide.foodBudget)}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Transportation
    if (tripPlan.transportation) {
      content += `
        <div class="section">
          <div class="section-title">🚗 Transportation</div>
          <div class="subsection">
            <div class="info-grid">
              ${tripPlan.transportation.fromAirport ? `
                <div class="info-item">
                  <div class="info-label">From Airport</div>
                  <div class="info-value">${tripPlan.transportation.fromAirport}</div>
                </div>
              ` : ''}
              ${tripPlan.transportation.localTransport ? `
                <div class="info-item">
                  <div class="info-label">Local Transport</div>
                  <div class="info-value">${tripPlan.transportation.localTransport}</div>
                </div>
              ` : ''}
              ${tripPlan.transportation.walkability ? `
                <div class="info-item">
                  <div class="info-label">Walkability</div>
                  <div class="info-value">${tripPlan.transportation.walkability}</div>
                </div>
              ` : ''}
            </div>
            ${tripPlan.transportation.recommendedApps && tripPlan.transportation.recommendedApps.length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Recommended Apps:</strong> ${tripPlan.transportation.recommendedApps.join(', ')}
              </div>
            ` : ''}
            ${tripPlan.transportation.tips && tripPlan.transportation.tips.length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Transportation Tips:</strong>
                <ul style="margin-left: 20px; margin-top: 5px;">
                  ${tripPlan.transportation.tips.map(tip => `<li style="margin-bottom: 5px;">${tip}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Cost Breakdown
    if (tripPlan.costBreakdown) {
      content += `
        <div class="section">
          <div class="section-title">💰 Cost Breakdown (${userPassportCountry} Rates)</div>
          <div class="cost-breakdown">
            ${tripPlan.costBreakdown.flights ? `
              <div class="cost-item">
                <span>✈️ Flights</span>
                <span>${tripPlan.costBreakdown.flights}</span>
              </div>
            ` : ''}
            ${tripPlan.costBreakdown.accommodation ? `
              <div class="cost-item">
                <span>🏨 Accommodation</span>
                <span>${tripPlan.costBreakdown.accommodation}</span>
              </div>
            ` : ''}
            ${tripPlan.costBreakdown.food ? `
              <div class="cost-item">
                <span>🍽️ Food & Dining</span>
                <span>${tripPlan.costBreakdown.food}</span>
              </div>
            ` : ''}
            ${tripPlan.costBreakdown.activities ? `
              <div class="cost-item">
                <span>🎯 Activities</span>
                <span>${tripPlan.costBreakdown.activities}</span>
              </div>
            ` : ''}
            ${tripPlan.costBreakdown.transportation ? `
              <div class="cost-item">
                <span>🚗 Transportation</span>
                <span>${tripPlan.costBreakdown.transportation}</span>
              </div>
            ` : ''}
            ${tripPlan.costBreakdown.visaAndFees ? `
              <div class="cost-item">
                <span>🛂 Visa & Fees (${userPassportCountry || 'International'})</span>
                <span>${tripPlan.costBreakdown.visaAndFees}</span>
              </div>
            ` : ''}
            ${tripPlan.costBreakdown.miscellaneous ? `
              <div class="cost-item">
                <span>🛍️ Miscellaneous</span>
                <span>${tripPlan.costBreakdown.miscellaneous}</span>
              </div>
            ` : ''}
            ${tripPlan.costBreakdown.total ? `
              <div class="cost-item cost-total">
                <span>💵 Total Estimated Cost</span>
                <span>${formatPrice(tripPlan.costBreakdown.total)}</span>
              </div>
            ` : ''}
            ${tripPlan.costBreakdown.dailyBudget ? `
              <div class="cost-item">
                <span>📅 Daily Budget</span>
                <span>${formatPrice(tripPlan.costBreakdown.dailyBudget)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Visa Information
    if (tripPlan.visaInfo) {
      content += `
        <div class="section">
          <div class="section-title">🛂 Visa Information (${userPassportCountry} Passport)</div>
          <div class="subsection">
            <div class="info-grid">
              ${tripPlan.visaInfo.required !== undefined ? `
                <div class="info-item">
                  <div class="info-label">Visa Required</div>
                  <div class="info-value">${tripPlan.visaInfo.required ? 'Yes' : 'No'}</div>
                </div>
              ` : ''}
              ${tripPlan.visaInfo.type ? `
                <div class="info-item">
                  <div class="info-label">Visa Type</div>
                  <div class="info-value">${tripPlan.visaInfo.type}</div>
                </div>
              ` : ''}
              ${tripPlan.visaInfo.duration ? `
                <div class="info-item">
                  <div class="info-label">Duration</div>
                  <div class="info-value">${tripPlan.visaInfo.duration}</div>
                </div>
              ` : ''}
              ${tripPlan.visaInfo.cost ? `
                <div class="info-item">
                  <div class="info-label">Cost</div>
                  <div class="info-value">${formatPrice(tripPlan.visaInfo.cost)}</div>
                </div>
              ` : ''}
              ${tripPlan.visaInfo.processingTime ? `
                <div class="info-item">
                  <div class="info-label">Processing Time</div>
                  <div class="info-value">${tripPlan.visaInfo.processingTime}</div>
                </div>
              ` : ''}
              ${tripPlan.visaInfo.embassyLocation ? `
                <div class="info-item">
                  <div class="info-label">Embassy Location</div>
                  <div class="info-value">${tripPlan.visaInfo.embassyLocation}</div>
                </div>
              ` : ''}
              ${tripPlan.visaInfo.applicationUrl ? `
                <div class="info-item">
                  <div class="info-label">Application URL</div>
                  <div class="info-value">${tripPlan.visaInfo.applicationUrl}</div>
                </div>
              ` : ''}
            </div>
            ${tripPlan.visaInfo.requirements && tripPlan.visaInfo.requirements.length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Requirements:</strong>
                <ul style="margin-left: 20px; margin-top: 5px;">
                  ${tripPlan.visaInfo.requirements.map(req => `<li style="margin-bottom: 5px;">${req}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${tripPlan.visaInfo.importantNotes && tripPlan.visaInfo.importantNotes.length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Important Notes:</strong>
                <ul style="margin-left: 20px; margin-top: 5px;">
                  ${tripPlan.visaInfo.importantNotes.map(note => `<li style="margin-bottom: 5px;">${note}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${tripPlan.visaInfo.visaPageReference ? `
              <div style="margin-top: 10px; padding: 10px; background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 5px;">
                <strong>For More Information:</strong><br>
                ${tripPlan.visaInfo.visaPageReference}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Insider Tips
    if (tripPlan.insiderTips && tripPlan.insiderTips.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">💡 Insider Tips & Recommendations</div>
          <div class="tips-list">
            ${tripPlan.insiderTips.map(tip => `
              <div class="tip-item">${tip}</div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Packing List
    if (tripPlan.packing) {
      content += `
        <div class="section">
          <div class="section-title">🎒 Packing Checklist</div>
          ${tripPlan.packing.essentials && tripPlan.packing.essentials.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">Essential Items</div>
              <ul style="margin-left: 20px;">
                ${tripPlan.packing.essentials.map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${tripPlan.packing.seasonal && tripPlan.packing.seasonal.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">Seasonal Items</div>
              <ul style="margin-left: 20px;">
                ${tripPlan.packing.seasonal.map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${tripPlan.packing.culturalConsiderations && tripPlan.packing.culturalConsiderations.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">Cultural Considerations</div>
              <ul style="margin-left: 20px;">
                ${tripPlan.packing.culturalConsiderations.map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    }

    content += `
      <div class="print-footer">
        <p><strong>SkyNfull Trip Planner</strong> - Your AI-Powered Travel Companion</p>
        <p>Generated on ${currentDate} • Real-time prices and information • Customized for ${userPassportCountry} passport holders</p>
        <p style="margin-top: 10px; font-style: italic;">
          📱 Download the SkyNfull app for real-time flight tracking, price alerts, and trip updates
        </p>
      </div>
    `;

    return content;
  };

  const getDestinationName = () => {
    if (typeof tripPlan.destination === 'string') {
      return tripPlan.destination;
    }
    return tripPlan.destination?.name || 'Trip Plan';
  };

  const getDestinationCountry = () => {
    if (typeof tripPlan.destination === 'object' && tripPlan.destination?.country) {
      return tripPlan.destination.country;
    }
    return null;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MapPin, color: 'from-blue-500 to-blue-600' },
    { id: 'flights', label: 'Flights', icon: Plane, color: 'from-sky-500 to-sky-600' },
    { id: 'accommodation', label: 'Hotels', icon: Hotel, color: 'from-purple-500 to-purple-600' },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar, color: 'from-green-500 to-green-600' },
    { id: 'map', label: 'Map', icon: Map, color: 'from-cyan-500 to-teal-600' },
    { id: 'food', label: 'Food', icon: Utensils, color: 'from-orange-500 to-orange-600' },
    { id: 'transport', label: 'Transport', icon: Car, color: 'from-indigo-500 to-indigo-600' },
    { id: 'costs', label: 'Budget', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    { id: 'tips', label: 'Tips', icon: Sparkles, color: 'from-yellow-500 to-yellow-600' },
  ];

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-start sm:items-center justify-center p-2 sm:p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200/50 dark:border-gray-700/50 mt-2 sm:mt-0 transition-transform duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full hidden sm:block"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full hidden sm:block"></div>
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 z-50">
            {/* One-Click Trip Creation Button */}
            {user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  handleOneClickTripCreation();
                }}
                disabled={isCreatingTrip}
                className={`p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 relative z-50 ${
                  isCreatingTrip 
                    ? 'bg-white/10 cursor-not-allowed opacity-50' 
                    : 'hover:bg-white/20 bg-white/10 cursor-pointer'
                }`}
                title="Create Trip from Plan"
                type="button"
              >
                {isCreatingTrip ? (
                  <div className="animate-spin">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                ) : (
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>
            )}

            {/* Print Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();

                handlePrint();
              }}
              disabled={isPrinting}
              className={`p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 relative z-50 ${
                isPrinting 
                  ? 'bg-white/10 cursor-not-allowed opacity-50' 
                  : 'hover:bg-white/20 bg-white/10 cursor-pointer'
              }`}
              title="Print Trip Plan"
              type="button"
            >
              {isPrinting ? (
                <div className="animate-spin">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              ) : (
                <Printer className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();

                handleClose();
              }}
              className="p-2 sm:p-3 hover:bg-white/20 bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer relative z-50"
              title="Close Modal"
              type="button"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
          
          {/* Success Message */}
          {showPrintSuccess && (
            <div className="absolute top-16 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-20 animate-fade-in">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Print ready!</span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 relative z-10 pr-20 sm:pr-24">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {getDestinationName()}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3 text-white/90">
                {tripPlan.duration && (
                  <span className="flex items-center gap-1 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    {tripPlan.duration}
                  </span>
                )}
                {(tripPlan.travelers || tripPlan.numberOfTravelers) && (
                  <span className="flex items-center gap-1 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    {tripPlan.travelers || tripPlan.numberOfTravelers} {(typeof tripPlan.travelers === 'string' ? parseInt(tripPlan.travelers) : tripPlan.travelers) === 1 || tripPlan.numberOfTravelers === 1 ? 'person' : 'people'}
                  </span>
                )}
                {getDestinationCountry() && (
                  <span className="flex items-center gap-1 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    {getDestinationCountry()}
                  </span>
                )}
                {(tripPlan.budget || tripPlan.costBreakdown?.total) && (
                  <span className="flex items-center gap-1 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    {formatPrice(tripPlan.budget || tripPlan.costBreakdown?.total || '')}
                  </span>
                )}
                {userPassportCountry && (
                  <span className="flex items-center gap-1 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    🛂 {userPassportCountry} Rates
                  </span>
                )}
                {/* Currency Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowCurrencyEdit(!showCurrencyEdit)}
                    className="flex items-center gap-1 sm:gap-2 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-white/20 transition-colors"
                    title="Click to change currency"
                  >
                    {getCurrencySymbol(userPreferredCurrency)} {userPreferredCurrency}
                    {/* Show indicator if using custom currency */}
                    {!currencies.find(c => c.code === userPreferredCurrency) && (
                      <span className="text-yellow-300" title="Custom Currency">*</span>
                    )}
                  </button>
                  
                  {showCurrencyEdit && (
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-30 min-w-[240px]">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select or Type Currency</div>
                      
                      {/* Custom Currency Input */}
                      <div className="mb-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customCurrency}
                            onChange={(e) => setCustomCurrency(e.target.value.toUpperCase().slice(0, 3))}
                            placeholder="USD, EUR..."
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            maxLength={3}
                          />
                          <button
                            onClick={() => {
                              if (customCurrency.length === 3) {
                                setTempCurrency(customCurrency);
                                handleCurrencyUpdate();
                                setCustomCurrency('');
                              }
                            }}
                            disabled={customCurrency.length !== 3}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              customCurrency.length === 3
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                            }`}
                          >
                            Set
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter 3-letter currency code</div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 dark:border-gray-600 mb-2"></div>
                      
                      {/* Predefined Currency List */}
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quick Select:</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {currencies.map((currency) => (
                          <button
                            key={currency.code}
                            onClick={() => {
                              setTempCurrency(currency.code);
                              handleCurrencyUpdate();
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              tempCurrency === currency.code ? 'bg-blue-100 dark:bg-blue-900' : ''
                            }`}
                          >
                            {currency.symbol} {currency.code} - {currency.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex overflow-x-auto scrollbar-hide px-2 sm:px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 font-medium transition-all duration-300 whitespace-nowrap rounded-t-xl mx-0.5 text-xs sm:text-sm ${
                    activeTab === tab.id
                      ? `text-white bg-gradient-to-r ${tab.color} shadow-lg transform -translate-y-1`
                      : 'text-gray-600 dark:text-gray-400 hover:text-skyneu-blue dark:hover:text-skyneu-blue hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[calc(95vh-200px)] overflow-y-auto bg-gradient-to-b from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm">
          
          {/* Fallback for missing trip plan data */}
          {!tripPlan || Object.keys(tripPlan).length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">Loading Trip Plan...</h3>
              <p className="text-gray-500">Please wait while we prepare your personalized trip plan.</p>
            </div>
          ) : (
            <div>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Destination Info */}
                  {(typeof tripPlan.destination === 'object' && tripPlan.destination?.name) || tripPlan.costBreakdown ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-300">
                  <MapPin className="h-5 w-5" />
                  {typeof tripPlan.destination === 'object' && tripPlan.destination?.name 
                    ? `${tripPlan.destination.name}${tripPlan.destination.country ? `, ${tripPlan.destination.country}` : ''}`
                    : typeof tripPlan.destination === 'string' ? tripPlan.destination : 'Destination'
                  }
                </h3>
                {(typeof tripPlan.destination === 'object' && tripPlan.destination?.overview) && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{tripPlan.destination.overview}</p>
                )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-xl">
                      <h4 className="font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        Essential Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {typeof tripPlan.destination === 'object' && tripPlan.destination?.timeZone && (
                          <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Time Zone:</span>
                            <span className="font-semibold">{tripPlan.destination.timeZone}</span>
                          </div>
                        )}
                        {typeof tripPlan.destination === 'object' && tripPlan.destination?.language && (
                          <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Language:</span>
                            <span className="font-semibold">{tripPlan.destination.language}</span>
                          </div>
                        )}
                        {typeof tripPlan.destination === 'object' && tripPlan.destination?.currency && (
                          <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                            <span className="font-semibold">{tripPlan.destination.currency}</span>
                          </div>
                        )}
                        {typeof tripPlan.destination === 'object' && tripPlan.destination?.bestTimeToVisit && (
                          <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Best Time:</span>
                            <span className="font-semibold">{tripPlan.destination.bestTimeToVisit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {typeof tripPlan.destination === 'object' && tripPlan.destination?.highlights && tripPlan.destination.highlights.length > 0 && (
                      <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-xl">
                        <h4 className="font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Top Highlights
                        </h4>
                        <ul className="space-y-2">
                          {tripPlan.destination.highlights.map((highlight: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                              <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Trip Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    {tripPlan.duration && (
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-3 rounded-lg text-center">
                        <Calendar className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                        <p className="font-bold text-green-800 dark:text-green-300">{tripPlan.duration}</p>
                      </div>
                    )}
                    {tripPlan.costBreakdown?.total && (
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-lg text-center">
                        <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                        <p className="font-bold text-blue-800 dark:text-blue-300">{formatPrice(tripPlan.costBreakdown.total)}</p>
                      </div>
                    )}
                    {tripPlan.costBreakdown?.dailyBudget && (
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-3 rounded-lg text-center">
                        <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Daily Budget</p>
                        <p className="font-bold text-purple-800 dark:text-purple-300">{formatPrice(tripPlan.costBreakdown.dailyBudget)}</p>
                      </div>
                    )}
                      </div>
                    </div>
                  ) : tripPlan.fullResponse ? (
                    <div className="bg-gradient-to-br from-skyneu-blue/5 to-skyneu-green/5 p-4 sm:p-6 rounded-xl border border-skyneu-blue/20">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-skyneu-blue">
                        <Sparkles className="h-5 w-5" />
                        AI-Generated Trip Plan
                      </h3>
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 p-4 rounded border font-sans">
                        {tripPlan.fullResponse}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-600 mb-2">No Trip Details Available</h3>
                      <p className="text-gray-500">Trip plan information will appear here once generated.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transportation Tab (Flights/Trains/Buses) */}
          {activeTab === 'flights' && (
            <div className="space-y-6">
              {/* Transportation Type Detection */}
              {(() => {
                const destination: string = typeof tripPlan.destination === 'string' ? tripPlan.destination : tripPlan.destination?.name || '';
                const homeAirport: string = ''; // TODO: Get from user preferences
                
                // Simple detection logic (can be enhanced)
                const isLocal = homeAirport && (
                  destination.toLowerCase().includes('india') ||
                  destination.toLowerCase().includes('delhi') ||
                  destination.toLowerCase().includes('mumbai') ||
                  destination.toLowerCase().includes('bangalore') ||
                  destination.toLowerCase().includes('hyderabad') ||
                  destination.toLowerCase().includes('chennai') ||
                  destination.toLowerCase().includes('kolkata') ||
                  destination.toLowerCase().includes('pune') ||
                  destination.toLowerCase().includes('jaipur') ||
                  destination.toLowerCase().includes('lucknow') ||
                  (homeAirport.toLowerCase().includes('india') && !destination.toLowerCase().includes('international'))
                );
                
                return (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${isLocal ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {isLocal ? 'Domestic Transportation' : 'International Transportation'}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isLocal 
                        ? 'Multiple transportation options available for domestic travel'
                        : 'Flight options for international travel'
                      }
                    </p>
                  </div>
                );
              })()}
              
              {tripPlan.flights ? (
                <div className="space-y-6">
                  {tripPlan.flights.outbound && (
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-sky-200 dark:border-sky-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-sky-800 dark:text-sky-300">
                        <Plane className="h-5 w-5" />
                        Outbound Flight
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Airline & Flight:</span>
                            <p className="font-semibold">{tripPlan.flights.outbound.airline} {tripPlan.flights.outbound.flightNumber}</p>
                          </div>
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Route:</span>
                            <p className="font-semibold">{tripPlan.flights.outbound.route}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Departure:</span>
                            <p className="font-semibold">{tripPlan.flights.outbound.departure}</p>
                          </div>
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Arrival:</span>
                            <p className="font-semibold">{tripPlan.flights.outbound.arrival}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4">
                        <div className="bg-white/70 dark:bg-gray-800/70 px-3 py-2 rounded">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Duration: </span>
                          <span className="font-semibold">{tripPlan.flights.outbound.duration}</span>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 px-3 py-2 rounded">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Price: </span>
                          <span className="font-semibold">{formatPrice(tripPlan.flights.outbound.price || '0')}</span>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded border-l-4 border-yellow-400">
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            ⚠️ <strong>Note:</strong> Actual prices may differ based on availability, booking time, and seasonal demand.
                          </p>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 px-3 py-2 rounded">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Class: </span>
                          <span className="font-semibold">{tripPlan.flights.outbound.class}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Total Flight Cost */}
                  {tripPlan.flights.outbound?.price && tripPlan.flights.return?.price && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Total Flight Cost</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            For {tripPlan.travelers || tripPlan.numberOfTravelers || 1} {(tripPlan.travelers && tripPlan.travelers === '1') || (tripPlan.numberOfTravelers && tripPlan.numberOfTravelers === 1) ? 'person' : 'people'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                            {formatPrice(tripPlan.flights.totalFlightCost || '0')}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {formatPrice(tripPlan.flights.outbound.price || '0')} + {formatPrice(tripPlan.flights.return.price || '0')} × {tripPlan.travelers || tripPlan.numberOfTravelers || 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Flight Price Graph */}
                  {tripPlan.flights.outbound?.priceRange && tripPlan.flights.return?.priceRange && (
                    <FlightPriceGraph
                      outbound={{
                        low: tripPlan.flights.outbound.priceRange.low || 0,
                        high: tripPlan.flights.outbound.priceRange.high || 0,
                        average: tripPlan.flights.outbound.priceRange.average || 0,
                        current: parseFloat(tripPlan.flights.outbound.price?.replace(/[^\d.-]/g, '') || '0')
                      }}
                      return={{
                        low: tripPlan.flights.return.priceRange.low || 0,
                        high: tripPlan.flights.return.priceRange.high || 0,
                        average: tripPlan.flights.return.priceRange.average || 0,
                        current: parseFloat(tripPlan.flights.return.price?.replace(/[^\d.-]/g, '') || '0')
                      }}
                      currency={userPreferredCurrency}
                    />
                  )}

                  {tripPlan.flights.return && (
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                        <Plane className="h-5 w-5 transform rotate-180" />
                        Return Flight
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Airline & Flight:</span>
                            <p className="font-semibold">{tripPlan.flights.return.airline} {tripPlan.flights.return.flightNumber}</p>
                          </div>
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Route:</span>
                            <p className="font-semibold">{tripPlan.flights.return.route}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Departure:</span>
                            <p className="font-semibold">{tripPlan.flights.return.departure}</p>
                          </div>
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Arrival:</span>
                            <p className="font-semibold">{tripPlan.flights.return.arrival}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4">
                        <div className="bg-white/70 dark:bg-gray-800/70 px-3 py-2 rounded">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Duration: </span>
                          <span className="font-semibold">{tripPlan.flights.return.duration}</span>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 px-3 py-2 rounded">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Price: </span>
                          <span className="font-semibold">{formatPrice(tripPlan.flights.return.price || '0')}</span>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 px-3 py-2 rounded">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Class: </span>
                          <span className="font-semibold">{tripPlan.flights.return.class}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Train Options for Local Destinations */}
                  {(() => {
                    const destination: string = typeof tripPlan.destination === 'string' ? tripPlan.destination : tripPlan.destination?.name || '';
                    const homeAirport: string = ''; // TODO: Get from user preferences
                    const isLocal = homeAirport && (
                      destination.toLowerCase().includes('india') ||
                      destination.toLowerCase().includes('delhi') ||
                      destination.toLowerCase().includes('mumbai') ||
                      destination.toLowerCase().includes('bangalore') ||
                      destination.toLowerCase().includes('hyderabad') ||
                      destination.toLowerCase().includes('chennai') ||
                      destination.toLowerCase().includes('kolkata') ||
                      destination.toLowerCase().includes('pune') ||
                      destination.toLowerCase().includes('jaipur') ||
                      destination.toLowerCase().includes('lucknow') ||
                      (homeAirport.toLowerCase().includes('india') && !destination.toLowerCase().includes('international'))
                    );
                    
                    if (isLocal && tripPlan.transportation?.train) {
                      return (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-800 dark:text-green-300">
                            <Train className="h-5 w-5" />
                            Train Options
                          </h3>
                          <div className="space-y-4">
                            {tripPlan.transportation.train.outbound && (
                              <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Outbound Train</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Train:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.outbound.trainName}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Route:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.outbound.route}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Departure:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.outbound.departure}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Arrival:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.outbound.arrival}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.outbound.duration}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                                    <p className="font-semibold">{formatPrice(tripPlan.transportation.train.outbound.price || '0')}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {tripPlan.transportation.train.return && (
                              <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Return Train</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Train:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.return.trainName}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Route:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.return.route}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Departure:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.return.departure}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Arrival:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.return.arrival}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                                    <p className="font-semibold">{tripPlan.transportation.train.return.duration}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                                    <p className="font-semibold">{formatPrice(tripPlan.transportation.train.return.price || '0')}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Bus Options for Local Destinations */}
                  {(() => {
                    const destination: string = typeof tripPlan.destination === 'string' ? tripPlan.destination : tripPlan.destination?.name || '';
                    const homeAirport: string = ''; // TODO: Get from user preferences
                    const isLocal = homeAirport && (
                      destination.toLowerCase().includes('india') ||
                      destination.toLowerCase().includes('delhi') ||
                      destination.toLowerCase().includes('mumbai') ||
                      destination.toLowerCase().includes('bangalore') ||
                      destination.toLowerCase().includes('hyderabad') ||
                      destination.toLowerCase().includes('chennai') ||
                      destination.toLowerCase().includes('kolkata') ||
                      destination.toLowerCase().includes('pune') ||
                      destination.toLowerCase().includes('jaipur') ||
                      destination.toLowerCase().includes('lucknow') ||
                      (homeAirport.toLowerCase().includes('india') && !destination.toLowerCase().includes('international'))
                    );
                    
                    if (isLocal && tripPlan.transportation?.bus) {
                      return (
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800 dark:text-orange-300">
                            <Bus className="h-5 w-5" />
                            Bus Options
                          </h3>
                          <div className="space-y-4">
                            {tripPlan.transportation.bus.outbound && (
                              <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                                <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">Outbound Bus</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Operator:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.outbound.operator}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Route:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.outbound.route}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Departure:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.outbound.departure}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Arrival:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.outbound.arrival}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.outbound.duration}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                                    <p className="font-semibold">{formatPrice(tripPlan.transportation.bus.outbound.price || '0')}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {tripPlan.transportation.bus.return && (
                              <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                                <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">Return Bus</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Operator:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.return.operator}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Route:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.return.route}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Departure:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.return.departure}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Arrival:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.return.arrival}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                                    <p className="font-semibold">{tripPlan.transportation.bus.return.duration}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Price:</span>
                                    <p className="font-semibold">{formatPrice(tripPlan.transportation.bus.return.price || '0')}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No Transportation Information</h3>
                  <p className="text-gray-500">Transportation details will appear here when available.</p>
                </div>
              )}
            </div>
          )}

          {/* Accommodation Tab */}
          {activeTab === 'accommodation' && (
            <div className="space-y-6">
              {tripPlan.accommodation ? (
                <div className="space-y-6">
                  {/* Primary Hotel */}
                  {tripPlan.accommodation.primary && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-800 dark:text-purple-300">
                        <Hotel className="h-5 w-5" />
                        {tripPlan.accommodation.primary.name || 'Primary Accommodation'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {tripPlan.accommodation.primary.type && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                              <p className="font-semibold">{tripPlan.accommodation.primary.type}</p>
                            </div>
                          )}
                          {tripPlan.accommodation.primary.location && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Location:</span>
                              <p className="font-semibold">{tripPlan.accommodation.primary.location}</p>
                            </div>
                          )}
                          {tripPlan.accommodation.primary.rating && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Rating:</span>
                              <p className="font-semibold">{tripPlan.accommodation.primary.rating}</p>
                            </div>
                          )}
                    </div>
                    <div className="space-y-3">
                          {tripPlan.accommodation.primary.pricePerNight && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Price per Night:</span>
                              <p className="font-semibold">{formatPrice(tripPlan.accommodation.primary.pricePerNight)}</p>
                            </div>
                          )}
                          {tripPlan.accommodation.primary.totalPrice && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">Total Hotel Cost</h4>
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                    For {tripPlan.travelers || tripPlan.numberOfTravelers || 1} {(tripPlan.travelers && tripPlan.travelers === '1') || (tripPlan.numberOfTravelers && tripPlan.numberOfTravelers === 1) ? 'person' : 'people'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                                    {(() => {
                                      // Always compute deterministically to avoid AI-inflated totals
                                      const travelers = tripPlan.travelers || tripPlan.numberOfTravelers || 1;
                                      const travelerCount = typeof travelers === 'string' ? 
                                        parseInt(travelers.match(/(\d+)/)?.[1] || '1') : travelers;
                                      const roomsNeeded = Math.ceil(travelerCount / 2);
                                      const isPerPerson = tripPlan.accommodation.primary.pricePerNight?.toLowerCase().includes('per person') || 
                                                         tripPlan.accommodation.primary.pricePerNight?.toLowerCase().includes('pp');
                                      const pricePerNight = extractNumericValue(tripPlan.accommodation.primary.pricePerNight || '0');
                                      const nights = parseInt(tripPlan.duration?.match(/(\d+)/)?.[1] || '5');
                                      const expectedTotal = isPerPerson 
                                        ? pricePerNight * nights * travelerCount 
                                        : pricePerNight * nights * roomsNeeded;
                                      return formatPrice(String(expectedTotal));
                                    })()}
                                  </p>
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                    {(() => {
                                      const travelers = tripPlan.travelers || tripPlan.numberOfTravelers || 1;
                                      const travelerCount = typeof travelers === 'string' ? 
                                        parseInt(travelers.match(/(\d+)/)?.[1] || '1') : travelers;
                                      const roomsNeeded = Math.ceil(travelerCount / 2);
                                      const isPerPerson = tripPlan.accommodation.primary.pricePerNight?.toLowerCase().includes('per person') || 
                                                         tripPlan.accommodation.primary.pricePerNight?.toLowerCase().includes('pp');
                                      
                                      if (isPerPerson) {
                                        return `${formatPrice(tripPlan.accommodation.primary.pricePerNight || '0')} × ${tripPlan.duration || '5 days'} × ${travelerCount} people`;
                                      } else {
                                        return `${formatPrice(tripPlan.accommodation.primary.pricePerNight || '0')} × ${tripPlan.duration || '5 days'} × ${roomsNeeded} room${roomsNeeded > 1 ? 's' : ''}`;
                                      }
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {tripPlan.accommodation.primary.address && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                              <p className="font-semibold text-sm">{tripPlan.accommodation.primary.address}</p>
                            </div>
                          )}
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-400">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                              ⚠️ <strong>Note:</strong> Hotel prices may vary based on availability, season, and booking platform. Always check current rates before booking.
                            </p>
                          </div>
                        </div>
                      </div>
                      {tripPlan.accommodation.primary.amenities && tripPlan.accommodation.primary.amenities.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-bold mb-2 text-purple-800 dark:text-purple-300">Amenities</h4>
                          <div className="flex flex-wrap gap-2">
                            {tripPlan.accommodation.primary.amenities.map((amenity, index) => (
                              <span key={index} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alternative Hotels */}
                  {tripPlan.accommodation.alternatives && tripPlan.accommodation.alternatives.length > 0 && (
                    <AlternativeHotels
                      hotels={tripPlan.accommodation.alternatives.filter(hotel => 
                        hotel.name && hotel.type && hotel.location && hotel.pricePerNight && 
                        hotel.totalPrice && hotel.rating && hotel.amenities && hotel.bookingUrl && hotel.whyRecommended
                      ) as Array<{
                        name: string;
                        type: string;
                        location: string;
                        pricePerNight: string;
                        totalPrice: string;
                        rating: string;
                        amenities: string[];
                        bookingUrl: string;
                        whyRecommended: string;
                      }>}
                      currency={userPreferredCurrency}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Hotel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No Accommodation Information</h3>
                  <p className="text-gray-500">Hotel details will appear here when available.</p>
                </div>
              )}
            </div>
          )}

          {/* Itinerary Tab */}
          {activeTab === 'itinerary' && (
            <div className="space-y-6">
              {tripPlan.itinerary && tripPlan.itinerary.length > 0 ? (
                <div className="space-y-4">
                  {tripPlan.itinerary.map((day, index) => (
                    <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-800 dark:text-green-300">
                        <Calendar className="h-5 w-5" />
                        Day {day.day}: {day.title}
                      </h3>
                      {day.activities && day.activities.length > 0 && (
                        <div className="space-y-3">
                          {day.activities.map((activity, actIndex) => (
                            <div key={actIndex} className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg border-l-4 border-green-400">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-sm font-medium">
                                  {activity.time}
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{activity.activity}</span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {activity.location && <p><strong>Location:</strong> {activity.location}</p>}
                                {activity.duration && <p><strong>Duration:</strong> {activity.duration}</p>}
                                {activity.cost && <p><strong>Cost:</strong> {activity.cost}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No Itinerary Available</h3>
                  <p className="text-gray-500">Daily activities will appear here when available.</p>
                </div>
              )}
            </div>
          )}

          {/* Map Tab */}
          {activeTab === 'map' && (
            <div className="h-96 lg:h-[600px]">
              <LeafletTripMap tripPlan={tripPlan} />
            </div>
          )}

          {/* Food Tab */}
          {activeTab === 'food' && (
            <div className="space-y-6">
              {tripPlan.foodGuide ? (
                <div className="space-y-6">
                  {tripPlan.foodGuide.mustTryDishes && tripPlan.foodGuide.mustTryDishes.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-800 dark:text-orange-300">
                        <Utensils className="h-5 w-5" />
                        Must-Try Dishes
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tripPlan.foodGuide.mustTryDishes.map((dish, index) => (
                          <div key={index} className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg text-center">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{dish}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {tripPlan.foodGuide.recommendedRestaurants && tripPlan.foodGuide.recommendedRestaurants.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                        <Star className="h-5 w-5" />
                        Recommended Restaurants
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tripPlan.foodGuide.recommendedRestaurants.map((restaurant, index) => (
                          <div key={index} className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">{restaurant.name}</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                              <p><strong>Price Range:</strong> {restaurant.priceRange}</p>
                              {restaurant.specialty && <p><strong>Specialty:</strong> {restaurant.specialty}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(tripPlan.foodGuide.foodBudget || tripPlan.foodGuide.averageMealCost) && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-800 dark:text-green-300">
                        <DollarSign className="h-5 w-5" />
                        Food Budget
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tripPlan.foodGuide.foodBudget && (
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Daily Budget:</span>
                            <p className="font-semibold">{formatPrice(tripPlan.foodGuide.foodBudget)}</p>
                          </div>
                        )}
                        {tripPlan.foodGuide.averageMealCost && (
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Average Meal Cost:</span>
                            <p className="font-semibold">{formatPrice(tripPlan.foodGuide.averageMealCost)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No Food Information</h3>
                  <p className="text-gray-500">Restaurant and cuisine details will appear here when available.</p>
                </div>
              )}
            </div>
          )}

          {/* Transport Tab */}
          {activeTab === 'transport' && (
            <div className="space-y-6">
              {tripPlan.transportation ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
                      <Car className="h-5 w-5" />
                      Transportation Guide
                    </h3>
                    <div className="space-y-4">
                      {tripPlan.transportation.fromAirport && (
                        <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 text-indigo-800 dark:text-indigo-300">From Airport</h4>
                          <p className="text-gray-700 dark:text-gray-300">{tripPlan.transportation.fromAirport}</p>
                        </div>
                      )}
                      {tripPlan.transportation.localTransport && (
                        <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 text-indigo-800 dark:text-indigo-300">Local Transport</h4>
                          <p className="text-gray-700 dark:text-gray-300">{tripPlan.transportation.localTransport}</p>
                        </div>
                      )}
                      {tripPlan.transportation.walkability && (
                        <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                          <h4 className="font-bold mb-2 text-indigo-800 dark:text-indigo-300">Walkability</h4>
                          <p className="text-gray-700 dark:text-gray-300">{tripPlan.transportation.walkability}</p>
                        </div>
                      )}
                    </div>
                    
                    {tripPlan.transportation.recommendedApps && tripPlan.transportation.recommendedApps.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-bold mb-2 text-indigo-800 dark:text-indigo-300">Recommended Apps</h4>
                        <div className="flex flex-wrap gap-2">
                          {tripPlan.transportation.recommendedApps.map((app, index) => (
                            <span key={index} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full text-sm">
                              {app}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {tripPlan.transportation.tips && tripPlan.transportation.tips.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-bold mb-2 text-indigo-800 dark:text-indigo-300">Transportation Tips</h4>
                        <ul className="space-y-2">
                          {tripPlan.transportation.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 p-2 bg-white/70 dark:bg-gray-800/70 rounded">
                              <span className="text-indigo-600 mt-1">•</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No Transportation Information</h3>
                  <p className="text-gray-500">Transport details will appear here when available.</p>
                </div>
              )}
            </div>
          )}

          {/* Costs Tab */}
          {activeTab === 'costs' && (
            <div className="space-y-6">
              {tripPlan.costBreakdown ? (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <DollarSign className="h-5 w-5" />
                    Cost Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {tripPlan.costBreakdown.flights && (
                      <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Flights:</span>
                        <p className="font-semibold text-lg">{tripPlan.costBreakdown.flights}</p>
                      </div>
                    )}
                    {tripPlan.costBreakdown.accommodation && (
                      <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Accommodation:</span>
                        <p className="font-semibold text-lg">{tripPlan.costBreakdown.accommodation}</p>
                      </div>
                    )}
                    {tripPlan.costBreakdown.food && (
                      <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Food:</span>
                        <p className="font-semibold text-lg">{tripPlan.costBreakdown.food}</p>
                      </div>
                    )}
                    {tripPlan.costBreakdown.activities && (
                      <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Activities:</span>
                        <p className="font-semibold text-lg">{tripPlan.costBreakdown.activities}</p>
                      </div>
                    )}
                    {tripPlan.costBreakdown.transportation && (
                      <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Transportation:</span>
                        <p className="font-semibold text-lg">{tripPlan.costBreakdown.transportation}</p>
                      </div>
                    )}
                    {tripPlan.costBreakdown.miscellaneous && (
                      <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Miscellaneous:</span>
                        <p className="font-semibold text-lg">{tripPlan.costBreakdown.miscellaneous}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-emerald-200 dark:border-emerald-700 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tripPlan.costBreakdown.total && (
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-lg">
                          <span className="text-sm text-emerald-600 dark:text-emerald-400">Total Trip Cost:</span>
                          <p className="font-bold text-2xl text-emerald-800 dark:text-emerald-300">{formatPrice(tripPlan.costBreakdown.total)}</p>
                        </div>
                      )}
                      {tripPlan.costBreakdown.dailyBudget && (
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                          <span className="text-sm text-blue-600 dark:text-blue-400">Daily Budget:</span>
                          <p className="font-bold text-2xl text-blue-800 dark:text-blue-300">{formatPrice(tripPlan.costBreakdown.dailyBudget)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No Cost Information</h3>
                  <p className="text-gray-500">Budget breakdown will appear here when available.</p>
                </div>
              )}
            </div>
          )}

          {/* Tips Tab */}
          {activeTab === 'tips' && (
            <div className="space-y-6">
              {(tripPlan.insiderTips || tripPlan.packing || tripPlan.visaInfo) ? (
                <div className="space-y-6">
                  {tripPlan.insiderTips && tripPlan.insiderTips.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                        <Sparkles className="h-5 w-5" />
                        Insider Tips
                      </h3>
                      <ul className="space-y-3">
                        {tripPlan.insiderTips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                            <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {tripPlan.packing && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300">
                        <Hotel className="h-5 w-5" />
                        Packing Guide
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tripPlan.packing.essentials && tripPlan.packing.essentials.length > 0 && (
                          <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                            <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-300">Essentials</h4>
                            <ul className="space-y-1">
                              {tripPlan.packing.essentials.map((item, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {tripPlan.packing.seasonal && tripPlan.packing.seasonal.length > 0 && (
                          <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                            <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-300">Seasonal Items</h4>
                            <ul className="space-y-1">
                              {tripPlan.packing.seasonal.map((item, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {tripPlan.packing.culturalConsiderations && tripPlan.packing.culturalConsiderations.length > 0 && (
                          <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                            <h4 className="font-bold mb-2 text-blue-800 dark:text-blue-300">Cultural Considerations</h4>
                            <ul className="space-y-1">
                              {tripPlan.packing.culturalConsiderations.map((item, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {tripPlan.visaInfo && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-800 dark:text-red-300">
                        <Globe className="h-5 w-5" />
                        Visa Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Required:</span>
                            <p className="font-semibold">{tripPlan.visaInfo.required ? 'Yes' : 'No'}</p>
                          </div>
                          {tripPlan.visaInfo.type && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                              <p className="font-semibold">{tripPlan.visaInfo.type}</p>
                            </div>
                          )}
                          {tripPlan.visaInfo.duration && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                              <p className="font-semibold">{tripPlan.visaInfo.duration}</p>
                            </div>
                          )}
                          {tripPlan.visaInfo.cost && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Cost:</span>
                              <p className="font-semibold">{formatPrice(tripPlan.visaInfo.cost)}</p>
                            </div>
                          )}
                          {tripPlan.visaInfo.processingTime && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Processing Time:</span>
                              <p className="font-semibold">{tripPlan.visaInfo.processingTime}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {tripPlan.visaInfo.embassyLocation && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Embassy Location:</span>
                              <p className="font-semibold text-sm">{tripPlan.visaInfo.embassyLocation}</p>
                            </div>
                          )}
                          {tripPlan.visaInfo.applicationUrl && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Application URL:</span>
                              <a href={tripPlan.visaInfo.applicationUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-800 underline">
                                Apply Online
                              </a>
                            </div>
                          )}
                          {tripPlan.visaInfo.requirements && tripPlan.visaInfo.requirements.length > 0 && (
                            <div className="bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
                              <h4 className="font-bold mb-2 text-red-800 dark:text-red-300">Requirements</h4>
                              <ul className="space-y-1">
                                {tripPlan.visaInfo.requirements.map((requirement, index) => (
                                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {requirement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Important Notes */}
                      {tripPlan.visaInfo.importantNotes && tripPlan.visaInfo.importantNotes.length > 0 && (
                        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <h4 className="font-bold mb-2 text-yellow-800 dark:text-yellow-300">Important Notes</h4>
                          <ul className="space-y-1">
                            {tripPlan.visaInfo.importantNotes.map((note, index) => (
                              <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">• {note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Visa Page Reference */}
                      {tripPlan.visaInfo.visaPageReference && (
                        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1">For More Information</h4>
                              <p className="text-sm text-blue-700 dark:text-blue-300">{tripPlan.visaInfo.visaPageReference}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No Tips Available</h3>
                  <p className="text-gray-500">Travel tips and recommendations will appear here when available.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TripPlanModal;
