// Price prediction service using Sonar API
// Analyzes flight price trends and provides booking recommendations

interface PricePredictionResult {
  trend: 'increasing' | 'decreasing' | 'stable';
  prediction: string;
  confidence: number;
  recommendation: 'book_now' | 'wait' | 'monitor';
  reasoning: string;
  priceChange: {
    percentage: number;
    amount: number;
    timeframe: string;
  };
  bestBookingWindow: string;
  riskFactors: string[];
}

interface PriceHistory {
  date: string;
  price: number;
  currency: string;
}

class PricePredictionService {
  private apiKey: string;
  private cache: Map<string, { data: PricePredictionResult; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.apiKey = import.meta.env.VITE_SONAR_API_KEY || '';
  }

  /**
   * Get price prediction for a flight route
   */
  async getPricePrediction(
    from: string,
    to: string,
    date: string,
    currentPrice: number,
    currency: string = 'USD'
  ): Promise<PricePredictionResult | null> {
    if (!this.apiKey) {
      console.warn('Sonar API key not configured for price prediction');
      return null;
    }

    const cacheKey = `${from}-${to}-${date}-${currentPrice}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const prediction = await this.fetchPricePrediction(from, to, date, currentPrice, currency);
      this.setCachedResult(cacheKey, prediction);
      return prediction;
    } catch (error) {
      console.error('Price prediction error:', error);
      return this.getFallbackPrediction(currentPrice, currency);
    }
  }

  /**
   * Fetch price prediction from Sonar API
   */
  private async fetchPricePrediction(
    from: string,
    to: string,
    date: string,
    currentPrice: number,
    currency: string
  ): Promise<PricePredictionResult> {
    const departureDate = new Date(date);
    const daysUntilDeparture = Math.ceil((departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const prompt = `
Analyze flight price trends for ${from} to ${to} departing ${date}.

Current Details:
- Current price: ${currency} ${currentPrice}
- Days until departure: ${daysUntilDeparture}
- Route: ${from} to ${to}

Research Requirements:
1. Search for current market trends for this specific route
2. Analyze historical price patterns for similar booking windows
3. Consider seasonality factors (holidays, events, weather)
4. Check airline capacity and demand indicators
5. Look for any recent price changes or promotions

Provide analysis in this exact JSON format:
{
  "trend": "increasing|decreasing|stable",
  "prediction": "Brief prediction text (e.g., 'Likely to increase 15% in next week')",
  "confidence": 85,
  "recommendation": "book_now|wait|monitor",
  "reasoning": "Detailed explanation of factors influencing the prediction",
  "priceChange": {
    "percentage": 15,
    "amount": 75,
    "timeframe": "next 7 days"
  },
  "bestBookingWindow": "Based on historical data, best time to book",
  "riskFactors": ["Factor 1", "Factor 2", "Factor 3"]
}

Critical: Only provide realistic predictions based on actual market data. If insufficient data, use "stable" trend with lower confidence.
`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a professional flight pricing analyst with access to real-time market data. Provide accurate, data-driven price predictions based on current market conditions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800,
        web_search: true
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return this.parsePredictionResponse(content, currentPrice, currency);
  }

  /**
   * Parse Sonar API response
   */
  private parsePredictionResponse(
    content: string,
    currentPrice: number,
    currency: string
  ): PricePredictionResult {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and sanitize the response
        return {
          trend: this.validateTrend(parsed.trend),
          prediction: parsed.prediction || 'Price trend analysis unavailable',
          confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
          recommendation: this.validateRecommendation(parsed.recommendation),
          reasoning: parsed.reasoning || 'Analysis based on current market conditions',
          priceChange: {
            percentage: Math.min(100, Math.max(-100, parsed.priceChange?.percentage || 0)),
            amount: Math.abs(parsed.priceChange?.amount || 0),
            timeframe: parsed.priceChange?.timeframe || 'next week'
          },
          bestBookingWindow: parsed.bestBookingWindow || 'Based on historical patterns',
          riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors.slice(0, 3) : []
        };
      }
    } catch (error) {
      console.error('Failed to parse prediction response:', error);
    }

    return this.getFallbackPrediction(currentPrice, currency);
  }

  /**
   * Get fallback prediction when API fails
   */
  private getFallbackPrediction(currentPrice: number, currency: string): PricePredictionResult {
    return {
      trend: 'stable',
      prediction: 'Price analysis unavailable - using general guidance',
      confidence: 30,
      recommendation: 'monitor',
      reasoning: 'Unable to fetch real-time market data. Consider monitoring prices for a few days.',
      priceChange: {
        percentage: 0,
        amount: 0,
        timeframe: 'unknown'
      },
      bestBookingWindow: 'Generally 2-8 weeks before departure for domestic, 1-3 months for international',
      riskFactors: ['Limited market data', 'Price volatility', 'Seasonal factors']
    };
  }

  /**
   * Validate trend value
   */
  private validateTrend(trend: any): 'increasing' | 'decreasing' | 'stable' {
    if (typeof trend === 'string') {
      const normalized = trend.toLowerCase();
      if (['increasing', 'decreasing', 'stable'].includes(normalized)) {
        return normalized as 'increasing' | 'decreasing' | 'stable';
      }
    }
    return 'stable';
  }

  /**
   * Validate recommendation value
   */
  private validateRecommendation(recommendation: any): 'book_now' | 'wait' | 'monitor' {
    if (typeof recommendation === 'string') {
      const normalized = recommendation.toLowerCase();
      if (['book_now', 'wait', 'monitor'].includes(normalized)) {
        return normalized as 'book_now' | 'wait' | 'monitor';
      }
    }
    return 'monitor';
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(key: string): PricePredictionResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached result
   */
  private setCachedResult(key: string, data: PricePredictionResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get prediction summary for display
   */
  getPredictionSummary(prediction: PricePredictionResult): string {
    if (prediction.confidence < 50) {
      return 'Uncertain';
    }

    switch (prediction.trend) {
      case 'increasing':
        return `+${prediction.priceChange.percentage}%`;
      case 'decreasing':
        return `-${prediction.priceChange.percentage}%`;
      default:
        return 'Stable';
    }
  }

  /**
   * Get recommendation color for UI
   */
  getRecommendationColor(recommendation: string): string {
    switch (recommendation) {
      case 'book_now':
        return 'text-green-600 bg-green-50';
      case 'wait':
        return 'text-yellow-600 bg-yellow-50';
      case 'monitor':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  /**
   * Get recommendation icon
   */
  getRecommendationIcon(recommendation: string): string {
    switch (recommendation) {
      case 'book_now':
        return '✓';
      case 'wait':
        return '⏳';
      case 'monitor':
        return '👁';
      default:
        return '?';
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const pricePredictionService = new PricePredictionService();

// Export types
export type { PricePredictionResult, PriceHistory };
