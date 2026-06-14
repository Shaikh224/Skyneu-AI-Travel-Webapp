import React, { useState } from 'react';
import FlightSearch from '../../components/FlightSearch';
import FlightResults from '../../components/FlightResults';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { usePinnedFlight } from '../../contexts/PinnedFlightContext';
import { useFlightInsightsCache } from '../../contexts/FlightInsightsCacheContext';
import PinnedFlightTracker from '../../components/flights/PinnedFlightTracker';
import AnnouncementBanner from '../../components/AnnouncementBanner';
import SEOHead from '@/components/seo/SEOHead';

const FlightSearchPage: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  const [searchData, setSearchData] = useState<any>(null);
  const [flightResults, setFlightResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceAnalysis, setPriceAnalysis] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  
  // Get pinned flight context (no need to destructure anything since we don't use it here)
  usePinnedFlight();
  
  // Get flight insights cache to clear on new search
  const { clearCache } = useFlightInsightsCache();

  // Secure API call to backend function
  const callFlightSearchFunction = async (action: string, searchData: any) => {
    const functionUrl = import.meta.env.VITE_FLIGHT_SEARCH_FUNCTION_URL;
    
    if (!functionUrl) {
      throw new Error('Flight search function URL not configured. Please add VITE_FLIGHT_SEARCH_FUNCTION_URL to .env');
    }
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        searchData
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }
    
    return response.json();
  };  const fetchFlightOffers = async (search: any, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const maxResults = isLoadMore ? 20 : 10;
      
      // Call secure backend function
      const result = await callFlightSearchFunction('search', {
        from: search.from,
        to: search.to,
        departDate: search.departDate,
        returnDate: search.returnDate,
        tripType: search.tripType,
        passengers: search.passengers,
        cabinClass: search.cabinClass,
        currency: search.currency || 'USD',
        max: maxResults,
        nonStop: search.nonStop || false
      });
      
      if (!result.success) {
        setError(result.error || 'Failed to fetch flight offers.');
        if (!isLoadMore) setFlightResults([]);
        return;
      }
      
      const newResults = result.data || [];
      if (isLoadMore) {
        // For load more, filter out duplicates and append new unique results
        const existingIds = new Set(flightResults.map(f => f.id));
        const uniqueNewResults = newResults.filter((result: any) => !existingIds.has(result.id));
        setFlightResults(prev => [...prev, ...uniqueNewResults]);
      } else {
        setFlightResults(newResults);
      }
      // Check if there are more results available based on the response
      setHasMoreResults(newResults.length >= 10);
    } catch (err: any) {
      console.error('Flight search error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to search flights. ';
      
      if (err.message?.includes('not configured')) {
        errorMessage += 'Flight search backend is not configured. Please set VITE_FLIGHT_SEARCH_FUNCTION_URL in your .env file.';
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        errorMessage += 'Unable to connect to flight search service. Please check your internet connection and ensure the Appwrite function is deployed and running.';
      } else if (err.message?.includes('Amadeus')) {
        errorMessage += err.message;
      } else {
        errorMessage += err.message || 'An unexpected error occurred. Please try again.';
      }
      
      setError(errorMessage);
      if (!isLoadMore) setFlightResults([]);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchPriceAnalysis = async (search: any) => {
    try {
      const result = await callFlightSearchFunction('price-analysis', {
        from: search.from,
        to: search.to,
        departDate: search.departDate,
        returnDate: search.returnDate,
        tripType: search.tripType,
        currency: search.currency || 'USD'
      });
      
      if (result.success && result.data) {
        setPriceAnalysis(result.data);
      } else {
        setPriceAnalysis(null);
      }
    } catch (err) {
      // Price analysis is optional, don't show error
      setPriceAnalysis(null);
    }
  };

  const handleSearch = async (data: any) => {
    // Clear all cached insights when performing a new search
    clearCache();
    
    setSearchData(data);
    setShowResults(true);
    await fetchFlightOffers(data);
    await fetchPriceAnalysis(data);
  };

  const loadMoreFlights = async () => {
    if (searchData && !loadingMore) {
      await fetchFlightOffers(searchData, true);
    }
  };

  const handleNewSearch = () => {
    // Clear cache when starting a new search
    clearCache();
    
    setShowResults(false);
    setSearchData(null);
    setFlightResults([]);
    setError(null);
    setHasMoreResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      <SEOHead
        title="Flight Search - Compare Flights & Analyze Prices | SkyNeu"
        description="Search and compare flights with SkyNeu. Intelligent filtering, real-time insights, and price analysis to help you find the best options fast."
        canonical="https://skyneu.com/flight-search"
        keywords="flight search, compare flights, airfare, ticket prices, flight deals, skyneu"
      />
      <AnnouncementBanner page="flight-search" />
      <main className="pt-8 sm:pt-12 pb-8 sm:pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
                    {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 rounded-full mb-4 sm:mb-6">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-skyneu-blue dark:text-skyneu-green" />
              <span className="text-xs sm:text-sm font-semibold text-skyneu-blue dark:text-skyneu-green">BETA: Real Flight Data</span>
            </div>
            <h1 className="font-bold text-3xl sm:text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4">
              Search & Compare Flights
            </h1>
            <p className="text-skyneu-text dark:text-dark-text-secondary max-w-2xl mx-auto text-sm sm:text-lg px-4 mb-4">
              Search millions of flights with our intelligent engine that learns your preferences and finds the best deals.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">Booking not yet available — Flight search only</span>
            </div>
          </div>

          {/* Search Form */}
          {!showResults && (
            <div className="max-w-7xl mx-auto">
              <FlightSearch onSearch={handleSearch} />
            </div>
          )}

          {/* Results Section */}
          {showResults && (
            <div className="max-w-7xl mx-auto">
              {/* Back to Search */}
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={handleNewSearch}
                  className="flex items-center gap-2 text-skyneu-blue hover:text-skyneu-blue/80 transition-colors font-medium text-sm sm:text-base"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>New Search</span>
                </button>
              </div>

              {/* Compact Search Bar */}
              <div className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-dark-border p-3 sm:p-4 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-skyneu-dark dark:text-dark-text">Route:</span>
                      <span className="text-skyneu-text dark:text-dark-text-secondary">{searchData?.from} → {searchData?.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-skyneu-dark dark:text-dark-text">Date:</span>
                      <span className="text-skyneu-text dark:text-dark-text-secondary">{searchData?.departDate}{searchData?.returnDate ? ` - ${searchData.returnDate}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-skyneu-dark dark:text-dark-text">Passengers:</span>
                      <span className="text-skyneu-text dark:text-dark-text-secondary">{searchData?.passengers?.adults} Adult{searchData?.passengers?.adults > 1 ? 's' : ''}{searchData?.passengers?.children > 0 ? `, ${searchData.passengers.children} Child` : ''}{searchData?.passengers?.infants > 0 ? `, ${searchData.passengers.infants} Infant` : ''}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleNewSearch}
                    className="sm:ml-auto px-3 sm:px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-blue/80 text-white rounded-xl hover:from-skyneu-blue/90 hover:to-skyneu-blue/70 transition-all duration-300 font-medium text-xs sm:text-sm"
                  >
                    Modify Search
                  </button>
                </div>
              </div>

              {/* Results */}
              <FlightResults 
                results={flightResults} 
                loading={loading} 
                error={error} 
                priceAnalysis={priceAnalysis} 
                currency={searchData?.currency}
                hasMoreResults={hasMoreResults}
                loadingMore={loadingMore}
                onLoadMore={loadMoreFlights}
              />
            </div>
          )}
        </div>
      </main>

      {/* Pinned Flight Tracker */}
      <PinnedFlightTracker />
    </div>
  );
};

export default FlightSearchPage;