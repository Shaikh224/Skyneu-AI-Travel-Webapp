import React, { useState, useEffect } from 'react';
import { MapPinIcon, SparklesIcon, Squares2X2Icon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { MapPinIcon as MapPinSolid } from '@heroicons/react/24/solid';
import { discoveryService, DiscoveryPlace } from '@/services/discoveryService';
import DiscoveryGrid from '@/components/DiscoveryGrid';
import { useDebounce } from '@/hooks/useDebounce';
import { MapPin, Heart, Compass, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/seo/SEOHead';


interface MoodOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const MOODS: MoodOption[] = [
  { id: 'romantic', name: 'Romantic', emoji: '💕', description: 'Perfect for couples' },
  { id: 'aesthetic', name: 'Aesthetic', emoji: '✨', description: 'Instagram-worthy spots' },
  { id: 'calm', name: 'Calm', emoji: '🧘', description: 'Peaceful and serene' },
  { id: 'hidden-gems', name: 'Hidden Gems', emoji: '💎', description: 'Secret local spots' },
  { id: 'adventure', name: 'Adventure', emoji: '🏔️', description: 'Thrilling experiences' },
  { id: 'cultural', name: 'Cultural', emoji: '🏛️', description: 'Rich in history' },
  { id: 'foodie', name: 'Foodie', emoji: '🍽️', description: 'Culinary delights' },
  { id: 'nature', name: 'Nature', emoji: '🌿', description: 'Natural beauty' }
];

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [places, setPlaces] = useState<DiscoveryPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<string>('');
  const [cachedPlaces, setCachedPlaces] = useState<Map<string, DiscoveryPlace[]>>(new Map());
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  
  // Debounce search queries
  const debouncedMood = useDebounce(selectedMood, 300);
  const debouncedLocation = useDebounce(location, 300);

  // Auto-detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            setUserLocation(data.city || data.locality || 'Unknown');
          } catch (error) {
          }
        },
        () => {
        }
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!selectedMood || !location) {
      return;
    }

    // Clear the deduplication cache for this search
    discoveryService.clearCache(selectedMood, location);
    
    setPage(1);
    setHasMore(true);
    setCurrentIndex(0);
    const cacheKey = `${selectedMood}-${location}`;
    
    // Check cache first
    if (cachedPlaces.has(cacheKey)) {
      setPlaces(cachedPlaces.get(cacheKey)!);
      return;
    }

    setLoading(true);
    try {
      const discoveredPlaces = await discoveryService.discoverPlaces(selectedMood, location, 1);
      
      setPlaces(discoveredPlaces);
      
      // Cache the results
      setCachedPlaces(prev => new Map(prev).set(cacheKey, discoveredPlaces));
      
      // If we got less than 5 places initially, we might not have more pages
      if (discoveredPlaces.length < 5) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePlaces = async () => {
    if (!selectedMood || !location || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const discoveredPlaces = await discoveryService.discoverPlaces(selectedMood, location, nextPage);
      
      if (discoveredPlaces.length === 0) {
        setHasMore(false);
      } else {
        setPlaces(prev => [...prev, ...discoveredPlaces]);
        setPage(nextPage);
        
        // If we got less than 5 places, we might be near the end
        if (discoveredPlaces.length < 5) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more places:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedMood || !location) return;

    setRefreshing(true);
    try {
      // Clear cache and reset pagination
      discoveryService.clearCache(selectedMood, location);
      setPage(1);
      setHasMore(true);
      setCurrentIndex(0);
      
      // Fetch fresh places
      const discoveredPlaces = await discoveryService.discoverPlaces(selectedMood, location, 1);
      
      setPlaces(discoveredPlaces);
      
      // Update cache
      const cacheKey = `${selectedMood}-${location}`;
      setCachedPlaces(prev => new Map(prev).set(cacheKey, discoveredPlaces));
      
      // If we got less than 5 places, we might not have more pages
      if (discoveredPlaces.length < 5) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error refreshing places:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };


  const currentPlace = places[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      <SEOHead
        title="Discover Places - Find Hidden Gems by Mood | SkyNeu"
        description="Discover amazing places tailored to your mood. Explore hidden gems, romantic getaways, foodie spots, and more with SkyNeu."
        canonical="https://skyneu.com/discover"
        keywords="discover places, hidden gems, romantic places, foodie spots, travel discovery, skyneu"
      />
      {/* Enhanced Background Elements with Beautiful Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main Blob Animations */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-skyneu-green/5 dark:bg-skyneu-green/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-skyneu-blue/20 dark:bg-skyneu-blue/30 rounded-full animate-float-slow"></div>
        <div className="absolute top-32 right-20 w-6 h-6 bg-skyneu-green/20 dark:bg-skyneu-green/30 rounded-full animate-float-medium"></div>
        <div className="absolute top-48 left-1/4 w-3 h-3 bg-skyneu-blue/15 dark:bg-skyneu-blue/25 rounded-full animate-float-fast"></div>
        <div className="absolute top-64 right-1/3 w-5 h-5 bg-skyneu-green/15 dark:bg-skyneu-green/25 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-32 left-20 w-4 h-4 bg-skyneu-blue/20 dark:bg-skyneu-blue/30 rounded-full animate-float-medium"></div>
        <div className="absolute bottom-48 right-10 w-3 h-3 bg-skyneu-green/20 dark:bg-skyneu-green/30 rounded-full animate-float-fast"></div>
        
        {/* Floating Squares */}
        <div className="absolute top-40 right-1/4 w-8 h-8 bg-skyneu-blue/10 dark:bg-skyneu-blue/20 rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-40 left-1/4 w-6 h-6 bg-skyneu-green/10 dark:bg-skyneu-green/20 rotate-45 animate-spin-reverse"></div>
        <div className="absolute top-60 left-1/2 w-4 h-4 bg-skyneu-blue/15 dark:bg-skyneu-blue/25 rotate-45 animate-spin-medium"></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 right-16 w-24 h-24 bg-gradient-to-r from-skyneu-green/10 to-skyneu-blue/10 dark:from-skyneu-green/20 dark:to-skyneu-blue/20 rounded-full animate-pulse-medium"></div>
        
        {/* Animated Lines */}
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-skyneu-blue/20 to-transparent animate-line-sweep"></div>
        <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-skyneu-green/20 to-transparent animate-line-sweep animation-delay-3000"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(skyneu-blue 1px, transparent 1px),
              linear-gradient(90deg, skyneu-blue 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}></div>
        </div>
      </div>

      {/* Page Header - Consistent with other pages */}
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            {/* Back Button */}
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-skyneu-dark dark:text-dark-text hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </button>

            {/* Action Buttons - Only show when places are loaded */}
            {places.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setPlaces([]);
                    setPage(1);
                    setHasMore(true);
                    setCurrentIndex(0);
                    discoveryService.clearCache(selectedMood, location);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-skyneu-dark dark:text-dark-text hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors shadow-sm"
                >
                  <Compass className="h-4 w-4" />
                  <span className="hidden sm:inline">New Search</span>
                  <span className="sm:hidden">New</span>
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-skyneu-blue hover:bg-skyneu-blue/90 disabled:bg-skyneu-blue/50 text-white rounded-xl transition-colors shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {refreshing ? 'Refreshing...' : 'Refresh Places'}
                  </span>
                  <span className="sm:hidden">
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="text-center mb-6 sm:mb-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
              <Compass className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">DISCOVER AMAZING PLACES</span>
              <span className="sm:hidden">DISCOVER PLACES</span>
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            
            {/* Main Heading */}
            <h1 className="font-bold text-2xl sm:text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4 bg-gradient-to-r from-skyneu-dark dark:from-dark-text to-skyneu-blue bg-clip-text text-transparent">
              Discover Places
            </h1>
            
            {/* Subheading */}
            <p className="text-skyneu-text dark:text-dark-text-secondary max-w-2xl mx-auto text-sm sm:text-lg px-4">
              Find amazing places based on your mood and discover hidden gems around the world
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      {places.length === 0 && (
        <div className="relative z-10">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-6 lg:space-y-8">
              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-sm lg:text-base font-medium text-skyneu-dark dark:text-dark-text">Where do you want to explore?</label>
                <div className="flex gap-2 lg:gap-3">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={userLocation || "Enter city or location"}
                    className="flex-1 px-4 py-3 lg:py-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-skyneu-dark dark:text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-skyneu-blue focus:border-skyneu-blue text-sm lg:text-base"
                  />
                  {userLocation && (
                    <button
                      onClick={() => setLocation(userLocation)}
                      className="px-4 py-3 lg:py-4 bg-skyneu-blue hover:bg-skyneu-blue/90 rounded-xl transition-colors text-white"
                    >
                      <MapPinSolid className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mood Selection */}
              <div className="space-y-3 lg:space-y-4">
                <label className="text-sm lg:text-base font-medium text-skyneu-dark dark:text-dark-text">What's your mood?</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`p-3 lg:p-4 rounded-xl border-2 transition-all ${
                        selectedMood === mood.id
                          ? 'border-skyneu-blue bg-skyneu-blue/10 dark:bg-skyneu-blue/20'
                          : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-skyneu-blue/50 dark:hover:border-skyneu-blue/50'
                      }`}
                    >
                      <div className="text-xl lg:text-2xl mb-1">{mood.emoji}</div>
                      <div className="font-medium text-xs lg:text-sm text-skyneu-dark dark:text-dark-text">{mood.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block">{mood.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={!selectedMood || !location || loading}
                className="w-full py-3 lg:py-4 bg-gradient-to-r from-skyneu-blue to-skyneu-blue/90 hover:from-skyneu-blue/90 hover:to-skyneu-blue disabled:from-gray-400 disabled:to-gray-500 rounded-xl font-medium transition-all text-white shadow-lg hover:shadow-xl text-sm lg:text-base"
              >
                {loading ? 'Discovering...' : 'Discover Places'}
              </button>
              
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && places.length === 0 && (
        <div className="relative z-10">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-200 dark:border-dark-border">
                <div className="w-6 h-6 border-2 border-skyneu-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="text-skyneu-dark dark:text-dark-text font-medium">Discovering amazing places...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Feed - Vertical Scrolling Grid */}
      {places.length > 0 && (
        <div className="relative pb-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <DiscoveryGrid 
              places={places} 
              onPlaceSelect={(index) => {
                setCurrentIndex(index);
              }}
              onLoadMore={loadMorePlaces}
              loadingMore={loadingMore}
              hasMore={hasMore}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default DiscoveryPage;
