import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, Droplets, RefreshCw, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Trip } from '../../types/trip';
import { getWeatherInsights } from '../../lib/gemini';

interface WeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
}

interface WeatherInsightsProps {
  trip: Trip;
  geminiApiKey?: string;
}

// Cache for weather data
const weatherCache = new Map<string, { forecast: WeatherData[], recommendations: string[], timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for weather data
const WEATHER_RATE_LIMIT = new Map<string, number>();
const RATE_LIMIT_DURATION = 10 * 60 * 1000; // 10 minutes between weather API calls

const WeatherInsights: React.FC<WeatherInsightsProps> = ({ trip, geminiApiKey }) => {
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [useAI] = useState(!!geminiApiKey);
  const [showDetailedForecast, setShowDetailedForecast] = useState(false);

  // Generate cache key for weather data
  const cacheKey = useMemo(() => {
    return `${trip.destination}-${trip.startDate}-${trip.endDate}`;
  }, [trip.destination, trip.startDate, trip.endDate]);

  // Check if we can use cached weather data
  const getCachedWeather = useCallback(() => {
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached;
    }
    return null;
  }, [cacheKey]);

  // Check rate limiting for weather API
  const canMakeWeatherCall = useCallback(() => {
    const lastCall = WEATHER_RATE_LIMIT.get(cacheKey);
    return !lastCall || (Date.now() - lastCall) > RATE_LIMIT_DURATION;
  }, [cacheKey]);

  // Generate weather summary
  const generateWeatherSummary = useCallback((forecastData: WeatherData[]) => {
    if (forecastData.length === 0) return 'Weather information not available';
    
    const temps = forecastData.map(f => f.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
    
    const conditions = forecastData.map(f => f.condition.toLowerCase());
    const rainDays = conditions.filter(c => c.includes('rain') || c.includes('drizzle') || c.includes('shower')).length;
    const sunnyDays = conditions.filter(c => c.includes('sunny') || c.includes('clear')).length;
    const cloudyDays = conditions.filter(c => c.includes('cloud') || c.includes('overcast')).length;
    
    let mainCondition = 'mixed conditions';
    if (sunnyDays >= forecastData.length / 2) mainCondition = 'mostly sunny';
    else if (rainDays >= forecastData.length / 2) mainCondition = 'frequent rain';
    else if (cloudyDays >= forecastData.length / 2) mainCondition = 'mostly cloudy';
    
    return `Expect ${mainCondition} with temperatures ${minTemp}°C to ${maxTemp}°C (avg ${avgTemp}°C)${rainDays > 0 ? `, ${rainDays} rainy day${rainDays > 1 ? 's' : ''}` : ''}`;
  }, []);

  useEffect(() => {
    loadWeatherData();
  }, [cacheKey, useAI]);

  const loadWeatherData = async (forceRefresh = false) => {
    // Skip cache if force refresh is requested
    if (!forceRefresh) {
      const cached = getCachedWeather();
      if (cached) {
        setForecast(cached.forecast);
        setRecommendations(cached.recommendations);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    
    try {
      if (useAI && geminiApiKey && (forceRefresh || canMakeWeatherCall())) {
        // Record API call time
        WEATHER_RATE_LIMIT.set(cacheKey, Date.now());

        const weatherData = await getWeatherInsights(
          trip.destination,
          trip.startDate,
          trip.endDate,
          geminiApiKey
        );
        
        // Cache the weather data
        weatherCache.set(cacheKey, {
          forecast: weatherData.forecast,
          recommendations: weatherData.recommendations,
          timestamp: Date.now()
        });

        setForecast(weatherData.forecast);
        setRecommendations(weatherData.recommendations);
      } else {
        // Fallback to basic recommendations
        setForecast([]);
        setRecommendations([
          'Check weather before departure',
          'Pack layers for temperature changes',
          'Bring umbrella for rain',
          'Consider seasonal clothing'
        ]);
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
      setForecast([]);
      setRecommendations(['Check local weather before departure']);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'cloudy':
      case 'overcast':
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rainy':
      case 'rain':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'snowy':
      case 'snow':
        return <CloudSnow className="h-6 w-6 text-blue-300" />;
      case 'partly-cloudy':
      default:
        return <Cloud className="h-6 w-6 text-gray-400" />;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 25) return 'text-red-500';
    if (temp >= 15) return 'text-orange-500';
    if (temp >= 5) return 'text-blue-500';
    return 'text-blue-700';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-sky-blue/10 rounded-lg">
            <Cloud className="h-5 w-5 text-sky-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weather Insights
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-sky-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading weather information...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-blue/10 rounded-lg">
            <Cloud className="h-5 w-5 text-sky-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weather Insights
          </h3>
        </div>
        <button
          onClick={() => loadWeatherData(true)}
          className="p-2 text-gray-500 hover:text-sky-600 transition-colors"
          title="Refresh weather data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Destination Header */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>Weather forecast for {trip.destination}</span>
        </div>

        {/* Weather Forecast */}
        {forecast.length > 0 && (
          <div>
            {/* Weather Summary */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Weather Overview</h4>
              <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                <p className="text-gray-700 dark:text-gray-300">
                  {generateWeatherSummary(forecast)}
                </p>
              </div>
            </div>

            {/* Detailed Forecast Dropdown */}
            <div>
              <button
                onClick={() => setShowDetailedForecast(!showDetailedForecast)}
                className="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  Detailed Daily Forecast ({forecast.length} days)
                </span>
                {showDetailedForecast ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {showDetailedForecast && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forecast.map((weather, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        {getWeatherIcon(weather.condition)}
                        <span className={`text-lg font-semibold ${getTemperatureColor(weather.temperature)}`}>
                          {weather.temperature}°C
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 capitalize">
                        {weather.condition}
                      </p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Droplets className="h-3 w-3" />
                          <span>{weather.humidity}% humidity</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind className="h-3 w-3" />
                          <span>{weather.windSpeed} km/h wind</span>
                        </div>
                      </div>
                      {weather.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {weather.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weather Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Packing & Planning Tips
            </h4>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800"
                >
                  <Thermometer className="h-4 w-4 text-sky-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {forecast.length === 0 && recommendations.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Cloud className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Weather information not available.</p>
            <p className="text-sm">Check local weather services for {trip.destination}</p>
          </div>
        )}

        {/* AI Status Indicator */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {useAI ? 
              `⛅ AI weather insights ${getCachedWeather() ? '(cached)' : '(fresh)'}` : 
              '📋 Basic weather tips'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherInsights;
