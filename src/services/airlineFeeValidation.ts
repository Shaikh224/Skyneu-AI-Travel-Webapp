// Airline fee validation service using Sonar API
// Validates cached fees against real-time data

import { AirlineFees } from '../data/airlineFees';

interface ValidatedFees extends AirlineFees {
  lastUpdated: string;
  source: string;
  confidence: number;
}

interface ValidationResult {
  fees: ValidatedFees;
  isAccurate: boolean;
  changes: string[];
}

class AirlineFeeValidationService {
  private apiKey: string;
  private cache: Map<string, { data: ValidatedFees; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.apiKey = import.meta.env.VITE_SONAR_API_KEY || '';
  }

  /**
   * Validate airline fees with Sonar API
   */
  async validateFeesWithSonar(
    airlineCode: string,
    route: string,
    cachedFees: AirlineFees
  ): Promise<ValidatedFees> {
    if (!this.apiKey) {
      console.warn('Sonar API key not configured for fee validation');
      return this.getFallbackFees(cachedFees);
    }

    const cacheKey = `${airlineCode}-${route}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const validatedFees = await this.fetchFeeValidation(airlineCode, route, cachedFees);
      this.setCachedResult(cacheKey, validatedFees);
      return validatedFees;
    } catch (error) {
      console.error('Fee validation error:', error);
      return this.getFallbackFees(cachedFees);
    }
  }

  /**
   * Fetch fee validation from Sonar API
   */
  private async fetchFeeValidation(
    airlineCode: string,
    route: string,
    cachedFees: AirlineFees
  ): Promise<ValidatedFees> {
    const prompt = `
CRITICAL: Search ONLY official ${airlineCode} airline website for CURRENT fee information.

Required Sources (search in this order):
1. Official ${airlineCode} airline website fees page
2. ${airlineCode} mobile app or booking system
3. Official airline press releases about fee changes

DO NOT use third-party travel sites or outdated information.

For route ${route}, verify these current fees:
- Checked baggage: 1st bag, 2nd bag, 3rd bag fees
- Seat selection: economy standard, extra legroom, premium economy
- Travel insurance cost
- In-flight meals: standard meal, premium meal
- Airport lounge access (one-time pass)
- Priority boarding fee

Current cached fees to verify:
${JSON.stringify(cachedFees, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "bags": {
    "first": 35,
    "second": 45,
    "third": 150
  },
  "seats": {
    "standard": 0,
    "extraLegroom": 40,
    "premium": 85
  },
  "insurance": 29,
  "meals": {
    "standard": 12,
    "premium": 25
  },
  "loungeAccess": 59,
  "priorityBoarding": 15,
  "lastUpdated": "${new Date().toISOString()}",
  "source": "Official ${airlineCode} website",
  "confidence": 95
}

IMPORTANT: 
- If fees match within $5 of cached values, confirm accuracy
- If fees differ significantly, provide updated amounts
- Include confidence level (0-100) based on source reliability
- Verify information is current for ${new Date().getFullYear()}
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
            content: 'You are a travel industry fee analyst with access to current airline pricing. Provide accurate, up-to-date fee information from official airline sources only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        web_search: true
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return this.parseValidationResponse(content, cachedFees);
  }

  /**
   * Parse Sonar API response
   */
  private parseValidationResponse(
    content: string,
    cachedFees: AirlineFees
  ): ValidatedFees {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and sanitize the response
        return {
          bags: {
            first: Math.max(0, parsed.bags?.first || cachedFees.bags.first),
            second: Math.max(0, parsed.bags?.second || cachedFees.bags.second),
            third: Math.max(0, parsed.bags?.third || cachedFees.bags.third)
          },
          seats: {
            standard: Math.max(0, parsed.seats?.standard || cachedFees.seats.standard),
            extraLegroom: Math.max(0, parsed.seats?.extraLegroom || cachedFees.seats.extraLegroom),
            premium: Math.max(0, parsed.seats?.premium || cachedFees.seats.premium)
          },
          insurance: Math.max(0, parsed.insurance || cachedFees.insurance),
          meals: {
            standard: Math.max(0, parsed.meals?.standard || cachedFees.meals.standard),
            premium: Math.max(0, parsed.meals?.premium || cachedFees.meals.premium)
          },
          loungeAccess: Math.max(0, parsed.loungeAccess || cachedFees.loungeAccess),
          priorityBoarding: Math.max(0, parsed.priorityBoarding || cachedFees.priorityBoarding),
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          source: parsed.source || 'Official airline website',
          confidence: Math.min(100, Math.max(0, parsed.confidence || 50))
        };
      }
    } catch (error) {
      console.error('Failed to parse validation response:', error);
    }

    return this.getFallbackFees(cachedFees);
  }

  /**
   * Get fallback fees when API fails
   */
  private getFallbackFees(cachedFees: AirlineFees): ValidatedFees {
    return {
      ...cachedFees,
      lastUpdated: new Date().toISOString(),
      source: 'Cached database (validation unavailable)',
      confidence: 30
    };
  }

  /**
   * Compare fees and detect changes
   */
  compareFees(original: AirlineFees, validated: ValidatedFees): ValidationResult {
    const changes: string[] = [];
    
    // Check for significant changes (>$5 difference)
    if (Math.abs(original.bags.first - validated.bags.first) > 5) {
      changes.push(`1st bag fee: $${original.bags.first} → $${validated.bags.first}`);
    }
    if (Math.abs(original.bags.second - validated.bags.second) > 5) {
      changes.push(`2nd bag fee: $${original.bags.second} → $${validated.bags.second}`);
    }
    if (Math.abs(original.seats.extraLegroom - validated.seats.extraLegroom) > 5) {
      changes.push(`Extra legroom: $${original.seats.extraLegroom} → $${validated.seats.extraLegroom}`);
    }
    if (Math.abs(original.seats.premium - validated.seats.premium) > 5) {
      changes.push(`Premium seat: $${original.seats.premium} → $${validated.seats.premium}`);
    }
    if (Math.abs(original.insurance - validated.insurance) > 5) {
      changes.push(`Insurance: $${original.insurance} → $${validated.insurance}`);
    }

    return {
      fees: validated,
      isAccurate: changes.length === 0,
      changes
    };
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(key: string): ValidatedFees | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached result
   */
  private setCachedResult(key: string, data: ValidatedFees): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
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

  /**
   * Get confidence level description
   */
  getConfidenceDescription(confidence: number): string {
    if (confidence >= 90) return 'Highly accurate - verified from official source';
    if (confidence >= 70) return 'Accurate - from reliable source';
    if (confidence >= 50) return 'Moderately accurate - may need verification';
    return 'Low confidence - using cached data';
  }

  /**
   * Get confidence color for UI
   */
  getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 70) return 'text-blue-600 bg-blue-50';
    if (confidence >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }
}

// Export singleton instance
export const airlineFeeValidationService = new AirlineFeeValidationService();

// Export types
export type { ValidatedFees, ValidationResult };
