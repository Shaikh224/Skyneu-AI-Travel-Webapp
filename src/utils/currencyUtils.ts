/**
 * Currency utility functions for handling various currencies including custom ones
 */

// Common currency symbols and information
export const CURRENCY_SYMBOLS: Record<string, { symbol: string; name: string; decimalPlaces: number }> = {
  // Major currencies
  'USD': { symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  'EUR': { symbol: '€', name: 'Euro', decimalPlaces: 2 },
  'GBP': { symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  'JPY': { symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
  'CAD': { symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2 },
  'AUD': { symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2 },
  'CHF': { symbol: 'CHF', name: 'Swiss Franc', decimalPlaces: 2 },
  'CNY': { symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 },
  'INR': { symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
  'AED': { symbol: 'د.إ', name: 'UAE Dirham', decimalPlaces: 2 },
  'SAR': { symbol: 'ر.س', name: 'Saudi Riyal', decimalPlaces: 2 },
  'SGD': { symbol: 'S$', name: 'Singapore Dollar', decimalPlaces: 2 },
  'BRL': { symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2 },
  'MXN': { symbol: '$', name: 'Mexican Peso', decimalPlaces: 2 },
  'KRW': { symbol: '₩', name: 'South Korean Won', decimalPlaces: 0 },
  'THB': { symbol: '฿', name: 'Thai Baht', decimalPlaces: 2 },
  
  // Cryptocurrencies
  'BTC': { symbol: '₿', name: 'Bitcoin', decimalPlaces: 8 },
  'ETH': { symbol: 'Ξ', name: 'Ethereum', decimalPlaces: 6 },
  'XRP': { symbol: 'XRP', name: 'Ripple', decimalPlaces: 6 },
  'LTC': { symbol: 'Ł', name: 'Litecoin', decimalPlaces: 8 },
  'BCH': { symbol: 'BCH', name: 'Bitcoin Cash', decimalPlaces: 8 },
  'ADA': { symbol: 'ADA', name: 'Cardano', decimalPlaces: 6 },
  'DOT': { symbol: 'DOT', name: 'Polkadot', decimalPlaces: 6 },
  'LINK': { symbol: 'LINK', name: 'Chainlink', decimalPlaces: 6 },
  'UNI': { symbol: 'UNI', name: 'Uniswap', decimalPlaces: 6 },
  'AAVE': { symbol: 'AAVE', name: 'Aave', decimalPlaces: 6 },
};

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCY_SYMBOLS[currencyCode.toUpperCase()];
  return currency?.symbol || currencyCode.toUpperCase();
}

/**
 * Get currency name for a given currency code
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = CURRENCY_SYMBOLS[currencyCode.toUpperCase()];
  return currency?.name || currencyCode.toUpperCase();
}

/**
 * Get decimal places for a given currency code
 */
export function getCurrencyDecimalPlaces(currencyCode: string): number {
  const currency = CURRENCY_SYMBOLS[currencyCode.toUpperCase()];
  return currency?.decimalPlaces || 2;
}

/**
 * Check if a currency code is valid (exists in our symbols list)
 */
export function isValidCurrency(currencyCode: string): boolean {
  return currencyCode.toUpperCase() in CURRENCY_SYMBOLS;
}

/**
 * Check if a currency is a cryptocurrency
 */
export function isCryptocurrency(currencyCode: string): boolean {
  const cryptoCurrencies = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'UNI', 'AAVE'];
  return cryptoCurrencies.includes(currencyCode.toUpperCase());
}

/**
 * Format currency amount with proper symbol and decimal places
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const currency = currencyCode.toUpperCase();
  const symbol = getCurrencySymbol(currency);
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  
  // For cryptocurrencies, use more decimal places if needed
  if (isCryptocurrency(currency)) {
    const formatted = amount.toFixed(decimalPlaces);
    return `${symbol} ${formatted}`;
  }
  
  // For regular currencies, use Intl.NumberFormat if supported
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    const formatted = amount.toFixed(decimalPlaces);
    return `${symbol} ${formatted}`;
  }
}

/**
 * Format currency amount with custom symbol (for custom currencies)
 */
export function formatCustomCurrency(amount: number, symbol: string, decimalPlaces: number = 2): string {
  const formatted = amount.toFixed(decimalPlaces);
  return `${symbol} ${formatted}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrencyAmount(amountString: string): number {
  // Remove currency symbols and commas
  const cleaned = amountString.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get all available currencies
 */
export function getAllCurrencies(): Array<{ code: string; symbol: string; name: string }> {
  return Object.entries(CURRENCY_SYMBOLS).map(([code, info]) => ({
    code,
    symbol: info.symbol,
    name: info.name
  }));
}

/**
 * Get popular currencies (most commonly used)
 */
export function getPopularCurrencies(): Array<{ code: string; symbol: string; name: string }> {
  const popularCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'AED', 'SAR', 'SGD'];
  return popularCodes.map(code => ({
    code,
    symbol: getCurrencySymbol(code),
    name: getCurrencyName(code)
  }));
}
