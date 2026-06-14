/**
 * Currency Conversion Service
 * Provides real-time currency conversion using external APIs
 */

import { formatCurrency, getCurrencySymbol } from '@/utils/currencyUtils';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

export interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  rate: number;
  formatted: string;
}

class CurrencyConversionService {
  private readonly baseUrl = 'https://api.exchangerate-api.com/v4/latest';
  private readonly fallbackUrl = 'https://api.fixer.io/latest';
  private cache: Map<string, ExchangeRate> = new Map();
  private readonly cacheExpiry = 60 * 60 * 1000; // 1 hour

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<ConversionResult> {
    try {
      // If same currency, return as-is
      if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
        return {
          amount,
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase(),
          convertedAmount: amount,
          rate: 1,
          formatted: formatCurrency(amount, toCurrency)
        };
      }

      // Get exchange rate
      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      
      // Calculate converted amount
      const convertedAmount = amount * rate;
      
      return {
        amount,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        convertedAmount,
        rate,
        formatted: formatCurrency(convertedAmount, toCurrency)
      };
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw new Error(`Failed to convert ${fromCurrency} to ${toCurrency}. Please try again.`);
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  private async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const cacheKey = `${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rate;
    }

    try {
      // Try primary API first
      const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
      
      // Cache the rate
      this.cache.set(cacheKey, {
        from: fromCurrency.toUpperCase(),
        to: toCurrency.toUpperCase(),
        rate,
        timestamp: Date.now()
      });
      
      return rate;
    } catch (error) {
      console.error('Primary exchange rate API failed:', error);
      
      // Try fallback API
      try {
        const rate = await this.fetchExchangeRateFallback(fromCurrency, toCurrency);
        
        // Cache the rate
        this.cache.set(cacheKey, {
          from: fromCurrency.toUpperCase(),
          to: toCurrency.toUpperCase(),
          rate,
          timestamp: Date.now()
        });
        
        return rate;
      } catch (fallbackError) {
        console.error('Fallback exchange rate API failed:', fallbackError);
        throw new Error('Unable to fetch exchange rates. Please try again later.');
      }
    }
  }

  /**
   * Fetch exchange rate from primary API
   */
  private async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/${fromCurrency.toUpperCase()}`);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }
    
    const data = await response.json();
    const rate = data.rates[toCurrency.toUpperCase()];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    return rate;
  }

  /**
   * Fetch exchange rate from fallback API
   */
  private async fetchExchangeRateFallback(fromCurrency: string, toCurrency: string): Promise<number> {
    const response = await fetch(`${this.fallbackUrl}?base=${fromCurrency.toUpperCase()}&symbols=${toCurrency.toUpperCase()}`);
    
    if (!response.ok) {
      throw new Error(`Fallback exchange rate API error: ${response.status}`);
    }
    
    const data = await response.json();
    const rate = data.rates[toCurrency.toUpperCase()];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    return rate;
  }

  /**
   * Get multiple exchange rates at once
   */
  async getMultipleRates(
    fromCurrency: string, 
    toCurrencies: string[]
  ): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${this.baseUrl}/${fromCurrency.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }
      
      const data = await response.json();
      const rates: Record<string, number> = {};
      
      toCurrencies.forEach(currency => {
        const rate = data.rates[currency.toUpperCase()];
        if (rate) {
          rates[currency.toUpperCase()] = rate;
        }
      });
      
      return rates;
    } catch (error) {
      console.error('Error fetching multiple exchange rates:', error);
      throw new Error('Failed to fetch exchange rates. Please try again.');
    }
  }

  /**
   * Convert cost breakdown to user's preferred currency
   */
  async convertCostBreakdown(
    costBreakdown: Record<string, any>,
    fromCurrency: string,
    toCurrency: string
  ): Promise<Record<string, any>> {
    try {
      const convertedBreakdown: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(costBreakdown)) {
        if (typeof value === 'object' && value !== null) {
          // Recursively convert nested objects
          convertedBreakdown[key] = await this.convertCostBreakdown(value, fromCurrency, toCurrency);
        } else if (typeof value === 'string' && this.containsCurrencyValue(value)) {
          // Extract numeric value and convert
          const numericValue = this.extractNumericValue(value);
          if (numericValue > 0) {
            const converted = await this.convert(numericValue, fromCurrency, toCurrency);
            convertedBreakdown[key] = converted.formatted;
          } else {
            convertedBreakdown[key] = value;
          }
        } else {
          convertedBreakdown[key] = value;
        }
      }
      
      return convertedBreakdown;
    } catch (error) {
      console.error('Error converting cost breakdown:', error);
      return costBreakdown; // Return original if conversion fails
    }
  }

  /**
   * Check if a string contains currency values
   */
  private containsCurrencyValue(value: string): boolean {
    // Check for various currency symbols and formats
    const currencyPatterns = [
      /\$/,           // Dollar sign
      /₹/,            // Rupee sign
      /€/,            // Euro sign
      /£/,            // Pound sign
      /¥/,            // Yen sign
      /د\.إ/,         // UAE Dirham
      /ر\.س/,         // Saudi Riyal
      /₩/,            // Won sign
      /฿/,            // Baht sign
      /lakhs?/i,      // Lakhs
      /crores?/i,     // Crores
      /thousands?/i,  // Thousands
      /\d+\.?\d*\s*(?:USD|EUR|GBP|INR|AED|SAR|JPY|CAD|AUD|CHF|CNY|SGD|BRL|MXN|KRW|THB)/i // Currency codes
    ];
    
    return currencyPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Extract numeric value from currency string
   */
  private extractNumericValue(value: string): number {
    // Handle various currency formats including lakhs, crores, etc.
    let cleaned = value.toString();
    
    // Convert lakhs to standard numbers (1 lakh = 100,000)
    cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*lakhs?/gi, (match, num) => {
      const value = parseFloat(num) * 100000;
      return value.toString();
    });
    
    // Convert crores to standard numbers (1 crore = 10,000,000)
    cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*crores?/gi, (match, num) => {
      const value = parseFloat(num) * 10000000;
      return value.toString();
    });
    
    // Convert thousands to standard numbers
    cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\s*thousands?/gi, (match, num) => {
      const value = parseFloat(num) * 1000;
      return value.toString();
    });
    
    // Extract numeric value (including commas and decimals)
    const match = cleaned.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export as default instance
const currencyConversionService = new CurrencyConversionService();
export default currencyConversionService;
