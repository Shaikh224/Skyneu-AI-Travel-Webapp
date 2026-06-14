import React, { useState } from 'react';
import { Plane, Brain, DollarSign, Briefcase, Leaf, Loader2 } from 'lucide-react';
import AIInsights from './AIInsights';
import BaggagePolicyModal from './flights/BaggagePolicyModalReal';
import PriceBreakdownModalFixed from './flights/PriceBreakdownModalFixed';
import SustainabilityModal from './flights/SustainabilityModal';
import { smartAirportTimeConversion } from '../utils/timezoneUtils';
import { calculateCarbonFootprint } from '../utils/carbonCalculator';
import { sustainabilityService } from '../services/sustainabilityService';
import { SustainabilityData } from '../types/sustainability';
import { useFlightInsightsCache } from '../contexts/FlightInsightsCacheContext';

interface FlightResultsProps {
  results: any[];
  loading: boolean;
  error: string | null;
  priceAnalysis?: any;
  currency?: string;
  hasMoreResults?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

const FlightResults: React.FC<FlightResultsProps> = ({ 
  results, 
  loading, 
  error, 
  priceAnalysis, 
  currency = 'USD', 
  hasMoreResults = false, 
  loadingMore = false, 
  onLoadMore 
}) => {
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  
  // New modal states
  const [showBaggageModal, setShowBaggageModal] = useState(false);
  const [showPriceBreakdownModal, setShowPriceBreakdownModal] = useState(false);
  const [showSustainabilityModal, setShowSustainabilityModal] = useState(false);
  const [selectedFlightForModal, setSelectedFlightForModal] = useState<any>(null);
  const [, setBaggageData] = useState<any>(null);
  const [priceBreakdownData, setPriceBreakdownData] = useState<any>(null);
  const [sustainabilityData, setSustainabilityData] = useState<Map<string, SustainabilityData>>(new Map());
  const [loadingBaggage, setLoadingBaggage] = useState(false);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [loadingSustainability, setLoadingSustainability] = useState<Set<string>>(new Set());
  
  // Get flight insights cache
  const { 
    getFlightCache, 
    setSustainabilityData: cacheSustainabilityData,
    hasCachedSustainabilityData 
  } = useFlightInsightsCache();
  
  // Helper to get flight ID
  const getFlightId = (flight: any): string => {
    if (flight?.id) return flight.id;
    const segment = flight?.itineraries?.[0]?.segments?.[0];
    if (segment) {
      return `${segment.carrierCode}${segment.number}-${segment.departure?.iataCode}-${segment.arrival?.iataCode}`;
    }
    return `flight-${Date.now()}`;
  };

  // Helper function to calculate carbon footprint

  // Fetch sustainability data for a flight
  const fetchSustainabilityData = async (flight: any) => {
    const flightId = getFlightId(flight);
    
    // Check cache first
    if (hasCachedSustainabilityData(flightId)) {
      console.log(`✅ Using cached Sustainability Data for flight ${flightId}`);
      const cachedData = getFlightCache(flightId);
      if (cachedData?.sustainabilityData) {
        setSustainabilityData(prev => new Map(prev).set(flightId, cachedData.sustainabilityData));
        return;
      }
    }
    
    if (sustainabilityData.has(flightId)) {
      return; // Already loaded
    }

    setLoadingSustainability(prev => new Set(prev).add(flightId));

    try {
      const data = await sustainabilityService.getSustainabilityData(flight, currency);
      setSustainabilityData(prev => new Map(prev).set(flightId, data));
      // Cache the sustainability data
      cacheSustainabilityData(flightId, data);
    } catch (error) {
      console.error('Error fetching sustainability data:', error);
    } finally {
      setLoadingSustainability(prev => {
        const newSet = new Set(prev);
        newSet.delete(flightId);
        return newSet;
      });
    }
  };

  // Handle sustainability button click
  const handleSustainabilityClick = async (flight: any) => {
    const flightId = getFlightId(flight);
    
    if (!sustainabilityData.has(flightId)) {
      await fetchSustainabilityData(flight);
    }
    
    setSelectedFlightForModal(flight);
    setShowSustainabilityModal(true);
  };

  // Get sustainability data for a flight
  const getSustainabilityData = (flight: any): SustainabilityData | null => {
    const flightId = getFlightId(flight);
    return sustainabilityData.get(flightId) || null;
  };

  // Check if sustainability data is loading
  const isSustainabilityLoading = (flight: any): boolean => {
    const flightId = getFlightId(flight);
    return loadingSustainability.has(flightId);
  };


  // Handler functions
  const handleBaggagePolicy = (flight: any) => {
    setSelectedFlightForModal(flight);
    setShowBaggageModal(true);
  };

  const handlePriceBreakdown = (flight: any) => {
    setSelectedFlightForModal(flight);
    setShowPriceBreakdownModal(true);
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-dark-border">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-skyneu-blue/20 to-skyneu-green/20 dark:from-skyneu-blue/30 dark:to-skyneu-green/30 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Brain className="h-8 w-8 text-skyneu-blue" />
            </div>
            <h3 className="text-xl font-bold text-skyneu-dark dark:text-dark-text mb-2">AI is Searching...</h3>
            <p className="text-skyneu-text dark:text-dark-text-secondary mb-6">
              Our intelligent engine is analyzing millions of flights to find your perfect match
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-dark-border text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-skyneu-blue/20 to-skyneu-green/20 dark:from-skyneu-blue/30 dark:to-skyneu-green/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Plane className="h-10 w-10 text-skyneu-blue" />
        </div>
        <h3 className="text-2xl font-bold text-skyneu-dark dark:text-dark-text mb-4">Error</h3>
        <p className="text-skyneu-text dark:text-dark-text-secondary mb-6 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-dark-border text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-skyneu-blue/20 to-skyneu-green/20 dark:from-skyneu-blue/30 dark:to-skyneu-green/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Plane className="h-10 w-10 text-skyneu-blue" />
        </div>
        <h3 className="text-2xl font-bold text-skyneu-dark dark:text-dark-text mb-4">No Results Found</h3>
        <p className="text-skyneu-text dark:text-dark-text-secondary mb-6 max-w-md mx-auto">
          No flights found for your search. Try adjusting your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {priceAnalysis && Array.isArray(priceAnalysis) && priceAnalysis.length > 0 && (
        <div className="bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 rounded-2xl p-6 mb-8 border border-skyneu-blue/10 dark:border-skyneu-blue/20 shadow flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="font-bold text-lg text-skyneu-dark dark:text-dark-text mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-skyneu-blue" />
              Flight Price Analysis
            </div>
            <div className="text-skyneu-text dark:text-dark-text-secondary text-sm mb-2">
              {`Price trends for this route and date range. Lower prices may be available on certain days.`}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-skyneu-dark dark:text-dark-text-secondary">
              <div>
                <span className="font-semibold">Lowest:</span> {priceAnalysis.reduce((min, d) => d.price.total < min ? d.price.total : min, priceAnalysis[0].price.total)} {priceAnalysis[0].price.currency}
              </div>
              <div>
                <span className="font-semibold">Highest:</span> {priceAnalysis.reduce((max, d) => d.price.total > max ? d.price.total : max, priceAnalysis[0].price.total)} {priceAnalysis[0].price.currency}
              </div>
              <div>
                <span className="font-semibold">Average:</span> {(
                  priceAnalysis.reduce((sum, d) => sum + parseFloat(d.price.total), 0) / priceAnalysis.length
                ).toFixed(2)} {priceAnalysis[0].price.currency}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-skyneu-green">Best Dates:</span>
            <div className="flex flex-wrap gap-2">
              {priceAnalysis
                .sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))
                .slice(0, 3)
                .map((d, i) => (
                  <span key={i} className="px-3 py-1 bg-skyneu-green/10 text-skyneu-green rounded-full text-xs font-medium">
                    {d.departureDate}: {d.price.total} {d.price.currency}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
      {results.map((flight, idx) => {
        const mainCarrier = flight.itineraries[0]?.segments[0]?.carrierCode;
        const airlineLogo = `https://pics.avs.io/64/64/${mainCarrier}.png`;
        const segments = flight.itineraries[0]?.segments || [];
        const dep = segments[0];
        const arr = segments[segments.length - 1];
        const depTime = dep?.departure?.at ? new Date(dep.departure.at) : null;
        const arrTime = arr?.arrival?.at ? new Date(arr.arrival.at) : null;
        const formatTime = (d: any) => d ? smartAirportTimeConversion(d, 'DEL', 'time') : '';
        const stops = segments.length - 1;
        const layovers = segments.slice(1).map((_: any, i: number) => segments[i].arrival.iataCode).join(', ');
        // Google Flights compare URL
        const depDate = depTime ? depTime.toISOString().slice(0, 10) : '';
        const retDate = flight.itineraries[1]?.segments?.[0]?.departure?.at ? new Date(flight.itineraries[1].segments[0].departure.at).toISOString().slice(0, 10) : '';
        const googleFlightsUrl = retDate
          ? `https://www.google.com/flights?hl=en#flt=${dep?.departure?.iataCode}.${arr?.arrival?.iataCode}.${depDate}*${arr?.arrival?.iataCode}.${dep?.departure?.iataCode}.${retDate}`
          : `https://www.google.com/flights?hl=en#flt=${dep?.departure?.iataCode}.${arr?.arrival?.iataCode}.${depDate}`;
        return (
          <div key={flight.id || idx} className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-dark-border mb-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              {/* Airline Info */}
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <img src={airlineLogo} alt={mainCarrier} className="w-14 h-14 rounded-full shadow border border-gray-200 dark:border-dark-border bg-white object-contain" />
                <div>
                  <div className="font-bold text-lg text-skyneu-dark dark:text-dark-text mb-1">{mainCarrier}</div>
                  <div className="text-xs text-skyneu-text dark:text-dark-text-secondary">Flight {dep?.carrierCode}{dep?.number}</div>
                </div>
              </div>
              {/* Price & Book */}
              <div className="flex flex-col items-end gap-2">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl">{flight.price?.currency} {flight.price?.total}</div>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-xl font-semibold hover:from-skyneu-blue/90 hover:to-skyneu-green/80 transition-all"
                  onClick={() => { setSelectedFlight(flight); setShowAIInsights(true); }}
                >
                  View AI Insights
                </button>
                <a
                  href={googleFlightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 px-4 py-2 bg-gray-100 dark:bg-dark-border text-skyneu-blue dark:text-skyneu-green rounded-xl font-medium text-sm hover:bg-skyneu-blue/10 hover:text-skyneu-blue transition-all"
                >
                  Compare on Google Flights
                </a>
              </div>
            </div>
            
            {/* Feature Buttons Row */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleBaggagePolicy(flight)} 
                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
              >
                <Briefcase className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-xs font-medium text-blue-800 dark:text-blue-200">Baggage Policy</div>
              </button>
              
              <button 
                onClick={() => handlePriceBreakdown(flight)}
                className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
              >
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-xs font-medium text-green-800 dark:text-green-200">Price Breakdown</div>
              </button>
              
              <button 
                onClick={() => handleSustainabilityClick(flight)}
                className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors relative"
                disabled={isSustainabilityLoading(flight)}
              >
                {isSustainabilityLoading(flight) ? (
                  <Loader2 className="h-5 w-5 mx-auto mb-1 text-emerald-600 animate-spin" />
                ) : (
                  <Leaf className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                )}
                <div className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                  {isSustainabilityLoading(flight) ? 'Loading...' : 'Carbon Emissions'}
                </div>
                {getSustainabilityData(flight)?.co2.isSustainable && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
              </button>
              
            </div>
            
            {/* Route & Details */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Departure */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-skyneu-blue">{dep?.departure?.iataCode}</div>
                  <div className="text-xs text-skyneu-dark dark:text-dark-text-secondary">{dep?.departure?.cityName || ''}</div>
                  <div className="text-lg font-semibold text-skyneu-dark dark:text-dark-text mt-1">{formatTime(depTime)}</div>
                </div>
              </div>
              {/* Flight Path */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stops === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`}</span>
                  {stops > 0 && layovers && (
                    <span className="text-xs text-skyneu-text dark:text-dark-text-secondary">via {layovers}</span>
                  )}
                </div>
                <div className="text-xs text-skyneu-dark dark:text-dark-text-secondary mb-1">Duration: {flight.itineraries[0]?.duration.replace('PT', '').toLowerCase()}</div>
                <div className="w-24 h-1 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full my-1"></div>
              </div>
              {/* Arrival */}
              <div className="flex items-center gap-4 justify-end">
                <div className="text-center">
                  <div className="text-xl font-bold text-skyneu-blue">{arr?.arrival?.iataCode}</div>
                  <div className="text-xs text-skyneu-dark dark:text-dark-text-secondary">{arr?.arrival?.cityName || ''}</div>
                  <div className="text-lg font-semibold text-skyneu-dark dark:text-dark-text mt-1">{formatTime(arrTime)}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Load More Flights Button */}
      {hasMoreResults && onLoadMore && (
        <div className="text-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-8 py-4 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-2xl font-semibold hover:from-skyneu-blue/90 hover:to-skyneu-green/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
          >
            {loadingMore ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Loading More Flights...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                Load More Flights
              </>
            )}
          </button>
          <p className="text-sm text-skyneu-text dark:text-dark-text-secondary mt-3">
            Discovering more flight options with AI-powered search
          </p>
        </div>
      )}
      
      <AIInsights 
        isOpen={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        flightData={selectedFlight}
        currency={currency}
      />
      
      {/* Baggage Policy Modal */}
      {showBaggageModal && (
        <BaggagePolicyModal
          isOpen={showBaggageModal}
          onClose={() => setShowBaggageModal(false)}
          flight={selectedFlightForModal}
        />
      )}

      {/* Price Breakdown Modal - Fixed Interactive Version */}
      {showPriceBreakdownModal && (
        <PriceBreakdownModalFixed
          isOpen={showPriceBreakdownModal}
          onClose={() => setShowPriceBreakdownModal(false)}
          flight={selectedFlightForModal}
          currency={currency}
        />
      )}

      {/* Sustainability Modal */}
      {showSustainabilityModal && (
        <SustainabilityModal
          isOpen={showSustainabilityModal}
          onClose={() => setShowSustainabilityModal(false)}
          flight={selectedFlightForModal}
          sustainabilityData={getSustainabilityData(selectedFlightForModal)}
          currency={currency}
        />
      )}
    </div>
  );
};

export default FlightResults;
