/**
 * CORS Proxy Service
 * Handles CORS issues with external APIs by using proxy services
 */

class CORSProxyService {
  private proxyUrls = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://thingproxy.freeboard.io/fetch/',
    'https://cors-anywhere.herokuapp.com/',
    'https://cors.bridged.cc/',
    'https://cors.eu.org/',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://cors.io/?',
    'https://crossorigin.me/'
  ];
  
  private currentProxyIndex = 0;
  private failedProxies = new Map<number, { error: string; timestamp: number; retryAfter: number }>();
  private maxRetries = 5; // Increased retries
  private rateLimitDelay = 10000; // 10 seconds delay for rate limited proxies

  /**
   * Make a request through CORS proxy
   */
  async fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error | null = null;
    
    // Try each proxy until one works
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      // Find next working proxy
      while (this.isProxyFailed(this.currentProxyIndex)) {
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyUrls.length;
      }
      
      const proxyUrl = this.proxyUrls[this.currentProxyIndex];
      
      try {
        console.log(`🌐 Attempt ${attempt + 1}: Using CORS proxy ${this.currentProxyIndex + 1}/${this.proxyUrls.length}: ${proxyUrl}`);
        
        let fullUrl: string;
        let requestOptions: RequestInit = { ...options };
        
        // Handle different proxy URL formats
        if (proxyUrl.includes('corsproxy.io')) {
          fullUrl = proxyUrl + url;
        } else if (proxyUrl.includes('allorigins.win')) {
          fullUrl = proxyUrl + encodeURIComponent(url);
        } else if (proxyUrl.includes('thingproxy.freeboard.io')) {
          fullUrl = proxyUrl + url;
        } else if (proxyUrl.includes('codetabs.com')) {
          fullUrl = proxyUrl + encodeURIComponent(url);
        } else if (proxyUrl.includes('cors.io')) {
          fullUrl = proxyUrl + url;
        } else if (proxyUrl.includes('crossorigin.me')) {
          fullUrl = proxyUrl + url;
        } else {
          fullUrl = proxyUrl + url;
        }
        
        const response = await fetch(fullUrl, {
          ...requestOptions,
          headers: {
            ...requestOptions.headers,
            'Origin': window.location.origin,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          },
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (response.ok) {
          console.log(`✅ Proxy ${this.currentProxyIndex + 1} succeeded`);
          return response;
        } else {
          // Handle specific error cases
          if (response.status === 429) {
            // Rate limited - mark proxy as failed with retry delay
            this.markProxyAsFailed(this.currentProxyIndex, 'Rate limited', 60000); // 1 minute delay
            throw new Error(`Proxy rate limited: ${response.status} ${response.statusText}`);
          } else if (response.status >= 500) {
            // Server error - mark proxy as failed with shorter delay
            this.markProxyAsFailed(this.currentProxyIndex, `Server error: ${response.status}`, 15000); // 15 second delay
            throw new Error(`Proxy server error: ${response.status} ${response.statusText}`);
          } else if (response.status === 403 || response.status === 401) {
            // Access denied - mark proxy as failed with longer delay
            this.markProxyAsFailed(this.currentProxyIndex, `Access denied: ${response.status}`, 120000); // 2 minute delay
            throw new Error(`Proxy access denied: ${response.status} ${response.statusText}`);
          } else {
            throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
          }
        }
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Proxy ${this.currentProxyIndex + 1} failed:`, error);
        
        // Mark this proxy as failed
        if (!this.failedProxies.has(this.currentProxyIndex)) {
          this.markProxyAsFailed(this.currentProxyIndex, error.message, 8000); // 8 second default delay
        }
        
        // Move to next proxy
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyUrls.length;
        
        // If we've tried all proxies, reset and try again
        if (this.failedProxies.size >= this.proxyUrls.length) {
          console.log('🔄 All proxies failed, waiting before retry...');
          await this.delay(5000); // Wait 5 seconds before retry
          this.cleanupExpiredFailures();
          this.currentProxyIndex = 0;
        }
      }
    }
    
    // All proxies failed, try direct request as final fallback
    console.log('🔄 All proxies failed, trying direct request as final fallback...');
    try {
      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'omit'
      });
      if (response.ok) {
        console.log('✅ Direct request succeeded (no CORS issues)');
        return response;
      } else {
        throw new Error(`Direct request failed: ${response.status} ${response.statusText}`);
      }
    } catch (directError) {
      console.error('❌ All proxies and direct request failed');
      throw new Error(`All CORS proxies and direct request failed. Last proxy error: ${lastError?.message}. Direct error: ${directError}`);
    }
  }

  /**
   * Check if a proxy is currently failed
   */
  private isProxyFailed(proxyIndex: number): boolean {
    const failure = this.failedProxies.get(proxyIndex);
    if (!failure) return false;
    
    // Check if retry delay has passed
    const now = Date.now();
    if (now - failure.timestamp < failure.retryAfter) {
      return true; // Still failed
    }
    
    // Retry delay passed, remove from failed list
    this.failedProxies.delete(proxyIndex);
    return false;
  }

  /**
   * Mark a proxy as failed
   */
  private markProxyAsFailed(proxyIndex: number, error: string, retryAfter: number): void {
    this.failedProxies.set(proxyIndex, {
      error,
      timestamp: Date.now(),
      retryAfter
    });
    console.log(`🚫 Marked proxy ${proxyIndex + 1} as failed: ${error} (retry in ${retryAfter/1000}s)`);
  }

  /**
   * Clean up expired failures
   */
  private cleanupExpiredFailures(): void {
    const now = Date.now();
    for (const [index, failure] of this.failedProxies.entries()) {
      if (now - failure.timestamp >= failure.retryAfter) {
        this.failedProxies.delete(index);
        console.log(`🔄 Proxy ${index + 1} failure expired, available for retry`);
      }
    }
  }

  /**
   * Simple delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if CORS proxy is needed
   */
  isCORSProxyNeeded(): boolean {
    // Check if we're in a browser environment
    return typeof window !== 'undefined' && window.location.protocol === 'http:';
  }

  /**
   * Get current proxy status
   */
  getProxyStatus(): string {
    if (!this.isCORSProxyNeeded()) {
      return 'Not needed (HTTPS/Node.js)';
    }
    
    const workingProxies = this.proxyUrls.length - this.failedProxies.size;
    const currentProxy = this.currentProxyIndex + 1;
    
    if (workingProxies === 0) {
      return 'All proxies failed - using direct requests';
    }
    
    return `Proxy ${currentProxy}/${this.proxyUrls.length} (${workingProxies} working)`;
  }

  /**
   * Reset failed proxies (useful for retry scenarios)
   */
  resetFailedProxies(): void {
    this.failedProxies.clear();
    this.currentProxyIndex = 0;
    console.log('🔄 Reset failed proxies');
  }

  /**
   * Get health status of all proxies
   */
  getProxyHealth(): { total: number; failed: number; working: number; current: number; failures: Array<{ proxy: number; error: string; retryIn: number }> } {
    const now = Date.now();
    const failures = Array.from(this.failedProxies.entries()).map(([index, failure]) => ({
      proxy: index + 1,
      error: failure.error,
      retryIn: Math.max(0, Math.ceil((failure.retryAfter - (now - failure.timestamp)) / 1000))
    }));
    
    return {
      total: this.proxyUrls.length,
      failed: this.failedProxies.size,
      working: this.proxyUrls.length - this.failedProxies.size,
      current: this.currentProxyIndex + 1,
      failures
    };
  }

  /**
   * Get detailed proxy information for debugging
   */
  getProxyDetails(): Array<{ index: number; url: string; status: 'working' | 'failed' | 'current'; error?: string; retryIn?: number }> {
    const now = Date.now();
    return this.proxyUrls.map((url, index) => {
      const failure = this.failedProxies.get(index);
      if (failure) {
        const retryIn = Math.max(0, Math.ceil((failure.retryAfter - (now - failure.timestamp)) / 1000));
        return {
          index: index + 1,
          url,
          status: 'failed' as const,
          error: failure.error,
          retryIn
        };
      }
      
      return {
        index: index + 1,
        url,
        status: index === this.currentProxyIndex ? 'current' as const : 'working' as const
      };
    });
  }
}

export default new CORSProxyService();
