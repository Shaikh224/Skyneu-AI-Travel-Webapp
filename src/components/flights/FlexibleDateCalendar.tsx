import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';

interface FlexibleDateCalendarProps {
  fromIata: string;
  toIata: string;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  currency: string;
}

interface DatePrice {
  date: string;
  price: number;
  currency: string;
  isSelected: boolean;
  isCheapest: boolean;
}

const FlexibleDateCalendar: React.FC<FlexibleDateCalendarProps> = ({
  fromIata,
  toIata,
  selectedDate,
  onDateSelect,
  currency
}) => {
  const [datePrices, setDatePrices] = useState<DatePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fromIata && toIata && selectedDate) {
      fetchDatePrices();
    }
  }, [fromIata, toIata, selectedDate]);

  const fetchDatePrices = async () => {
    if (!fromIata || !toIata || !selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      // Generate dates ±3 days from selected date
      const baseDate = new Date(selectedDate);
      const dates = [];
      
      for (let i = -3; i <= 3; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      // For demo purposes, generate mock prices
      // In real implementation, you would call Amadeus API for each date
      const mockPrices = dates.map((date, index) => {
        const basePrice = 500;
        const variation = (Math.random() - 0.5) * 200; // ±100 variation
        const dayOfWeek = new Date(date).getDay();
        
        // Weekend pricing (Friday-Sunday typically more expensive)
        const weekendMultiplier = (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) ? 1.2 : 1.0;
        
        const price = Math.round((basePrice + variation) * weekendMultiplier);
        
        return {
          date,
          price,
          currency,
          isSelected: date === selectedDate,
          isCheapest: false // Will be set after all prices are calculated
        };
      });

      // Find cheapest price
      const cheapestPrice = Math.min(...mockPrices.map(dp => dp.price));
      const pricesWithCheapest = mockPrices.map(dp => ({
        ...dp,
        isCheapest: dp.price === cheapestPrice
      }));

      setDatePrices(pricesWithCheapest);
    } catch (error) {
      console.error('Error fetching date prices:', error);
      setError('Unable to load flexible date prices');
    } finally {
      setLoading(false);
    }
  };

  const formatDay = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriceColor = (datePrice: DatePrice): string => {
    if (datePrice.isSelected) {
      return 'bg-blue-500 text-white border-blue-500';
    }
    if (datePrice.isCheapest) {
      return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    }
    if (datePrice.price > 600) {
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
    }
    if (datePrice.price > 500) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  };

  if (!fromIata || !toIata || !selectedDate) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl p-4 mb-6 border border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Flexible Dates</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">(±3 days)</span>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading date prices...</span>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchDatePrices}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {datePrices.map((datePrice) => (
            <button
              key={datePrice.date}
              onClick={() => onDateSelect(datePrice.date)}
              className={`p-2 rounded-lg border text-center transition-all duration-200 ${getPriceColor(datePrice)}`}
            >
              <div className="text-xs font-medium mb-1">{formatDay(datePrice.date)}</div>
              <div className="text-xs mb-1">{formatDate(datePrice.date)}</div>
              <div className="flex items-center justify-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span className="text-sm font-bold">{datePrice.price}</span>
              </div>
              {datePrice.isCheapest && (
                <div className="text-xs font-medium text-green-600 mt-1">Best</div>
              )}
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        💡 Click any date to update your search. Green = cheapest, yellow = moderate, red = expensive
      </div>
    </div>
  );
};

export default FlexibleDateCalendar;
