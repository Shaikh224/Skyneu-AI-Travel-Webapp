interface DiscoveryPlace {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  mood: string;
  location: string;
  photographer?: string;
  photographerUrl?: string;
}

interface SonarResponse {
  places: Array<{
    name: string;
    description: string;
  }>;
}

interface UnsplashResponse {
  results: Array<{
    urls: {
      regular: string;
      full: string;
    };
    user: {
      name: string;
      links: {
        html: string;
      };
    };
  }>;
}

class DiscoveryService {
  private sonarApiKey: string;
  private unsplashApiKey: string;
  private fetchedPlaces: Map<string, Set<string>>; // Cache for tracking fetched places per search

  constructor() {
    this.sonarApiKey = import.meta.env.VITE_SONAR_API_KEY || '';
    this.unsplashApiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
    this.fetchedPlaces = new Map();
    
    // Debug logging
    if (!this.unsplashApiKey) {
      console.warn('⚠️ Unsplash API key not configured. Discovery images will use fallback.');
    }
    if (!this.sonarApiKey) {
      console.warn('⚠️ Sonar API key not configured. Discovery will use mock data.');
    }
  }

  /**
   * Query Sonar API with custom query
   */
  async querySonarAPIWithQuery(query: string): Promise<Array<{ name: string; description: string }>> {
    if (!this.sonarApiKey) {
      console.warn('Sonar API key not configured, using mock data');
      return this.getMockPlaces('', '');
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sonarApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: query
            }
          ],
          web_search: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sonar API error:', response.status, errorText);
        throw new Error(`Sonar API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseSonarResponse(data);
    } catch (error) {
      console.error('Error querying Sonar API:', error);
      return this.getMockPlaces('', '');
    }
  }

  /**
   * Query Sonar API for places based on mood and location
   */
  async querySonarAPI(mood: string, location: string): Promise<Array<{ name: string; description: string }>> {
    if (!this.sonarApiKey) {
      console.warn('Sonar API key not configured, using mock data');
      return this.getMockPlaces(mood, location);
    }

    try {
      const query = `List the most ${mood} places or hidden spots in ${location} with brief descriptions. Return concise names and one-line descriptions.`;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sonarApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          web_search: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Sonar API error: ${response.status}`, errorText);
        throw new Error(`Sonar API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseSonarResponse(data);
    } catch (error) {
      console.error('Error querying Sonar API:', error);
      return this.getMockPlaces(mood, location);
    }
  }

  /**
   * Search Unsplash for images of a specific place
   */
  async searchUnsplashImage(placeName: string, location: string, mood: string): Promise<{
    imageUrl: string;
    photographer: string;
    photographerUrl: string;
  }> {
    if (!this.unsplashApiKey) {
      console.warn('Unsplash API key not configured, using placeholder');
      return {
        imageUrl: `https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop&q=80`,
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com'
      };
    }

    try {
      // Clean place name for better search results
      const cleanPlaceName = placeName
        .replace(/\([^)]*\)/g, '') // Remove location in parentheses
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
        .trim();

      // Try multiple search strategies for better results
      const searchQueries = [
        `${cleanPlaceName} ${location}`,
        `${cleanPlaceName} restaurant food`,
        `${cleanPlaceName} ${mood}`,
        `${location} food street`,
        `${location} restaurant`,
        cleanPlaceName,
        location,
        'food restaurant'
      ];

      for (const query of searchQueries) {
        
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=3&client_id=${this.unsplashApiKey}`
        );

        if (!response.ok) {
          console.error(`Unsplash API error: ${response.status}`, await response.text());
          continue; // Try next query
        }

        const data: UnsplashResponse = await response.json();
        
        if (data.results && data.results.length > 0) {
          // Pick the best image (first one with good quality)
          const photo = data.results[0];
          const imageUrl = photo.urls.regular || photo.urls.small || photo.urls.thumb;
          
          if (imageUrl) {
            return {
              imageUrl: imageUrl,
              photographer: photo.user.name || 'Unsplash',
              photographerUrl: photo.user.links?.html || 'https://unsplash.com'
            };
          }
        }
      }

      // If all searches failed, return a fallback image
      console.warn('No Unsplash images found, using fallback');
      return {
        imageUrl: `https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop&q=80`,
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com'
      };
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      return {
        imageUrl: `https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop&q=80`,
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com'
      };
    }
  }

  /**
   * Main method to discover places with images
   */
  async discoverPlaces(mood: string, location: string, page: number = 1): Promise<DiscoveryPlace[]> {
    try {
      // Create a unique key for this search
      const searchKey = `${mood}-${location}`;
      
      // Initialize the fetched places set for this search if it doesn't exist
      if (!this.fetchedPlaces.has(searchKey)) {
        this.fetchedPlaces.set(searchKey, new Set());
      }
      
      const fetchedPlaceNames = this.fetchedPlaces.get(searchKey)!;
      
      // Define different queries for each page to get variety
      const queries = [
        `List the most ${mood} places or hidden spots in ${location} with brief descriptions. Return concise names and one-line descriptions.`,
        `hidden gems and secret spots in ${location} for ${mood} experiences`,
        `offbeat and lesser-known places in ${location} perfect for ${mood}`,
        `unique and unusual spots in ${location} for ${mood} adventures`,
        `local favorites and insider places in ${location} for ${mood} mood`,
        `quiet and peaceful locations in ${location} for ${mood} atmosphere`,
        `cultural and historical sites in ${location} for ${mood} exploration`,
        `natural and scenic spots in ${location} for ${mood} experiences`
      ];
      
      const queryIndex = (page - 1) % queries.length;
      const query = queries[queryIndex];
      
      
      // Get places from Sonar API
      const places = await this.querySonarAPIWithQuery(query);
      
      if (places.length === 0) {
        return [];
      }
      
      // Filter out already fetched places
      const newPlaces = places.filter(place => {
        const normalizedName = this.normalizePlaceName(place.name);
        return !fetchedPlaceNames.has(normalizedName);
      });
      
      if (newPlaces.length === 0) {
        // Try the next query if all places were duplicates
        const nextQueryIndex = (queryIndex + 1) % queries.length;
        const nextQuery = queries[nextQueryIndex];
        
        const nextPlaces = await this.querySonarAPIWithQuery(nextQuery);
        const nextNewPlaces = nextPlaces.filter(place => {
          const normalizedName = this.normalizePlaceName(place.name);
          return !fetchedPlaceNames.has(normalizedName);
        });
        
        if (nextNewPlaces.length === 0) {
          return [];
        }
        
        // Use the new places from the alternative query
        const limitedPlaces = nextNewPlaces.slice(0, 5);
        
        // Add to fetched places
        limitedPlaces.forEach(place => {
          const normalizedName = this.normalizePlaceName(place.name);
          fetchedPlaceNames.add(normalizedName);
        });
        
        // Get images for each place
        const placesWithImages = await Promise.all(
          limitedPlaces.map(async (place, index) => {
            const imageData = await this.searchUnsplashImage(place.name, location, mood);
            
            return {
              id: `place-${(page - 1) * 5 + index}`,
              title: place.name,
              description: place.description,
              imageUrl: imageData.imageUrl,
              mood: mood,
              location: location,
              photographer: imageData.photographer,
              photographerUrl: imageData.photographerUrl
            };
          })
        );

        return placesWithImages;
      }
      
      // Always limit to 5 places per page
      const limitedPlaces = newPlaces.slice(0, 5);
      
      // Add to fetched places
      limitedPlaces.forEach(place => {
        const normalizedName = this.normalizePlaceName(place.name);
        fetchedPlaceNames.add(normalizedName);
      });
        
        // Get images for each place
        const placesWithImages = await Promise.all(
        limitedPlaces.map(async (place, index) => {
            const imageData = await this.searchUnsplashImage(place.name, location, mood);
            
            return {
              id: `place-${(page - 1) * 5 + index}`,
              title: place.name,
              description: place.description,
              imageUrl: imageData.imageUrl,
              mood: mood,
              location: location,
              photographer: imageData.photographer,
              photographerUrl: imageData.photographerUrl
            };
          })
        );

        return placesWithImages;
    } catch (error) {
      console.error('Error discovering places:', error);
      // Only return mock data as last resort for page 1
      if (page === 1) {
      return this.getMockPlacesWithImages(mood, location);
      }
      return [];
    }
  }

  /**
   * Parse Sonar API response
   */
  private parseSonarResponse(data: any): Array<{ name: string; description: string }> {
    try {
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return [];
      }

      // Parse the response text to extract place names and descriptions
      const lines = content.split('\n').filter(line => line.trim());
      const places: Array<{ name: string; description: string }> = [];

      for (const line of lines) {
        let trimmedLine = line.trim();
        
        // Skip empty lines and headers
        if (!trimmedLine || trimmedLine.match(/^(Here are|Here's|Some|Top|Based on|Here is|These places|For|Exploring|These spots)/i)) {
          continue;
        }

        // Process different line formats
        let placeName = '';
        let description = '';

        // Format 1: "**Place Name (Location):** Description"
        let match = trimmedLine.match(/^\*\*(.+?)\*\*\s*\(([^)]+)\):\s*(.+)$/);
        if (match) {
          placeName = match[1].trim();
          const location = match[2].trim();
          description = match[3].trim();
          
          // Clean up the description
          description = this.cleanDescription(description);
          
          if (placeName.length > 3 && description.length > 10) {
            places.push({ 
              name: `${placeName} (${location})`,
              description: description
            });
            continue;
          }
        }

        // Format 2: "**Place Name:** Description"
        match = trimmedLine.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
        if (match) {
          placeName = match[1].trim();
          description = match[2].trim();
          
          description = this.cleanDescription(description);
          
          if (placeName.length > 3 && description.length > 10) {
            places.push({ 
              name: placeName,
              description: description
            });
            continue;
          }
        }

        // Format 3: "**Place Name**" followed by description on next line
        match = trimmedLine.match(/^\*\*(.+?)\*\*\s*$/);
        if (match) {
          placeName = match[1].trim();
          // Look for description in the next line
          const nextLineIndex = lines.indexOf(trimmedLine) + 1;
          if (nextLineIndex < lines.length) {
            const nextLine = lines[nextLineIndex].trim();
            if (nextLine && !nextLine.startsWith('**') && !nextLine.startsWith('#')) {
              description = this.cleanDescription(nextLine);
              if (placeName.length > 3 && description.length > 10) {
                places.push({ 
                  name: placeName,
                  description: description
                });
                continue;
              }
            }
          }
        }

        // Format 4: "1. **Place Name** - Description"
        match = trimmedLine.match(/^\d+\.\s*\*\*(.+?)\*\*\s*[-–]\s*(.+)$/);
        if (match) {
          placeName = match[1].trim();
          description = match[2].trim();
          
          description = this.cleanDescription(description);
          
          if (placeName.length > 3 && description.length > 10) {
            places.push({ 
              name: placeName,
              description: description
            });
            continue;
          }
        }

        // Format 5: "1. Place Name - Description"
        match = trimmedLine.match(/^\d+\.\s*(.+?)\s*[-–]\s*(.+)$/);
        if (match) {
          placeName = match[1].trim();
          description = match[2].trim();
          
          description = this.cleanDescription(description);
          
          if (placeName.length > 3 && description.length > 10) {
            places.push({ 
              name: placeName,
              description: description
            });
            continue;
          }
        }

        // Format 6: "- **Place Name** - Description"
        if (trimmedLine.startsWith('-')) {
          trimmedLine = trimmedLine.substring(1).trim();
          
          // Try different patterns within bullet points
          match = trimmedLine.match(/^\*\*(.+?)\*\*\s*[-–]\s*(.+)$/);
          if (match) {
            placeName = match[1].trim();
            description = match[2].trim();
          } else if (trimmedLine.includes(':')) {
            const colonIndex = trimmedLine.indexOf(':');
            placeName = trimmedLine.substring(0, colonIndex).trim();
            description = trimmedLine.substring(colonIndex + 1).trim();
          } else if (trimmedLine.includes(' - ')) {
            const dashIndex = trimmedLine.indexOf(' - ');
            placeName = trimmedLine.substring(0, dashIndex).trim();
            description = trimmedLine.substring(dashIndex + 3).trim();
          }
          
          if (placeName && description) {
            placeName = this.cleanName(placeName);
            description = this.cleanDescription(description);
            
            if (placeName.length > 3 && description.length > 10) {
              places.push({ 
                name: placeName,
                description: description
              });
              continue;
            }
          }
        }

        // Format 7: "Place Name: Description" (without bullet points)
        if (trimmedLine.includes(':') && !trimmedLine.startsWith('-') && !trimmedLine.match(/^\d+\./)) {
          const colonIndex = trimmedLine.indexOf(':');
          placeName = trimmedLine.substring(0, colonIndex).trim();
          description = trimmedLine.substring(colonIndex + 1).trim();
          
          placeName = this.cleanName(placeName);
          description = this.cleanDescription(description);
          
          if (placeName.length > 3 && description.length > 10) {
            places.push({ 
              name: placeName,
              description: description
            });
            continue;
          }
        }
      }


      // Validate parsed places
      const validPlaces = places.filter(place => 
        place.name && 
        place.name.length > 3 && 
        place.description && 
        place.description.length > 10 &&
        !place.name.includes('undefined') &&
        !place.description.includes('undefined') &&
        !place.name.toLowerCase().includes('here are') &&
        !place.name.toLowerCase().includes('these places')
      );


      return validPlaces.slice(0, 5); // Limit to 5 places
    } catch (error) {
      console.error('Error parsing Sonar API response:', error);
      return [];
    }
  }

  /**
   * Clean up place name
   */
  private cleanName(name: string): string {
    return name
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/^\d+\.\s*/, '') // Remove numbering
      .replace(/^[-•]\s*/, '') // Remove bullet points
      .trim();
  }

  /**
   * Clean up description
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/\[\d+\]/g, '') // Remove citations
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/^[-•]\s*/, '') // Remove bullet points
      .trim();
  }

  /**
   * Normalize place name for deduplication
   */
  private normalizePlaceName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b(the|a|an)\b/g, '') // Remove common articles
      .trim();
  }

  /**
   * Clear fetched places cache for a specific search
   */
  clearCache(mood: string, location: string): void {
    const searchKey = `${mood}-${location}`;
    this.fetchedPlaces.delete(searchKey);
  }

  /**
   * Clear all fetched places cache
   */
  clearAllCache(): void {
    this.fetchedPlaces.clear();
  }

  /**
   * Mock data for development
   */
  private getMockPlaces(mood: string, location: string): Array<{ name: string; description: string }> {
    const mockPlaces = {
      romantic: [
        { name: 'Piazzale Michelangelo', description: 'Iconic hilltop terrace offering stunning sunset views over the city.' },
        { name: 'Boboli Gardens', description: 'Historic landscaped gardens with romantic corners and hidden fountains.' },
        { name: 'Ponte Vecchio', description: 'Ancient bridge lined with jewelry shops, perfect for romantic walks.' },
        { name: 'Rose Garden', description: 'Hidden garden with panoramic views and blooming roses.' },
        { name: 'Santo Spirito', description: 'Authentic neighborhood with charming cafes and artisan workshops.' }
      ],
      aesthetic: [
        { name: 'Duomo Cathedral', description: 'Magnificent Gothic cathedral with stunning architecture and intricate details.' },
        { name: 'Palazzo Pitti', description: 'Grand Renaissance palace with opulent rooms and art collections.' },
        { name: 'Uffizi Gallery', description: 'World-famous art museum housing Renaissance masterpieces.' },
        { name: 'Piazza della Signoria', description: 'Historic square with impressive sculptures and medieval architecture.' },
        { name: 'San Miniato al Monte', description: 'Beautiful basilica with panoramic city views and peaceful atmosphere.' }
      ],
      calm: [
        { name: 'Giardino delle Rose', description: 'Peaceful rose garden with quiet corners and city views.' },
        { name: 'Santo Spirito Church', description: 'Serene Renaissance church with beautiful frescoes and quiet atmosphere.' },
        { name: 'Bardini Gardens', description: 'Hidden garden with terraced landscapes and peaceful walking paths.' },
        { name: 'San Miniato al Monte', description: 'Hilltop basilica offering tranquility and panoramic views.' },
        { name: 'Arno River Banks', description: 'Quiet riverside paths perfect for peaceful walks and reflection.' }
      ],
      'hidden-gems': [
        { name: 'Bardini Gardens', description: 'Secret terraced garden with stunning views and few tourists.' },
        { name: 'Santo Spirito Market', description: 'Local market with authentic food and artisan products.' },
        { name: 'Oltrarno District', description: 'Authentic neighborhood with artisan workshops and local cafes.' },
        { name: 'Torre del Gallo', description: 'Hidden tower with panoramic views and peaceful atmosphere.' },
        { name: 'Villa Bardini', description: 'Historic villa with beautiful gardens and art exhibitions.' }
      ]
    };

    return mockPlaces[mood as keyof typeof mockPlaces] || mockPlaces.romantic;
  }

  /**
   * Mock data with images for development
   */
  private getMockPlacesWithImages(mood: string, location: string): DiscoveryPlace[] {
    const places = this.getMockPlaces(mood, location);
    const imageUrls = [
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544966503-7cc4bb7b4e2b?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'
    ];

    return places.map((place, index) => ({
      id: `place-${index}`,
      title: place.name,
      description: place.description,
      imageUrl: imageUrls[index % imageUrls.length],
      mood: mood,
      location: location,
      photographer: 'Unsplash',
      photographerUrl: 'https://unsplash.com'
    }));
  }
}

export const discoveryService = new DiscoveryService();
export type { DiscoveryPlace };
