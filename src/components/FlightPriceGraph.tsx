import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FlightPriceData {
  low: number;
  high: number;
  average: number;
  current: number;
}

interface FlightPriceGraphProps {
  outbound: FlightPriceData;
  return: FlightPriceData;
  currency: string;
}

const FlightPriceGraph: React.FC<FlightPriceGraphProps> = ({ outbound, return: returnFlight, currency }) => {
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'INR': '₹',
      'GBP': '£',
      'JPY': '¥',
      'AED': 'د.إ',
      'SAR': 'ر.س'
    };
    return symbols[currency] || currency;
  };

  const formatPrice = (price: number) => {
    return `${getCurrencySymbol(currency)}${price.toLocaleString()}`;
  };

  const getPriceTrend = (current: number, average: number) => {
    if (current > average * 1.1) return 'high';
    if (current < average * 0.9) return 'low';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'high':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const outboundTrend = getPriceTrend(outbound.current, outbound.average);
  const returnTrend = getPriceTrend(returnFlight.current, returnFlight.average);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Flight Price Analysis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outbound Flight */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Outbound Flight</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(outboundTrend)}`}>
                {formatPrice(outbound.current)}
                {getTrendIcon(outboundTrend)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Low</span>
                <span className="font-medium">{formatPrice(outbound.low)}</span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((outbound.current - outbound.low) / (outbound.high - outbound.low)) * 100}%` 
                  }}
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">High</span>
                <span className="font-medium">{formatPrice(outbound.high)}</span>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Average: {formatPrice(outbound.average)}
            </div>
          </div>
        </div>

        {/* Return Flight */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Return Flight</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(returnTrend)}`}>
                {formatPrice(returnFlight.current)}
                {getTrendIcon(returnTrend)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Low</span>
                <span className="font-medium">{formatPrice(returnFlight.low)}</span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((returnFlight.current - returnFlight.low) / (returnFlight.high - returnFlight.low)) * 100}%` 
                  }}
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">High</span>
                <span className="font-medium">{formatPrice(returnFlight.high)}</span>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Average: {formatPrice(returnFlight.average)}
            </div>
          </div>
        </div>
      </div>

      {/* Total Cost */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900 dark:text-white">Total Flight Cost</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(outbound.current + returnFlight.current)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FlightPriceGraph;
