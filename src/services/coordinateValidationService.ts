/**
 * Coordinate Validation Service
 * Ensures all coordinates are valid and properly formatted for map plotting
 */

export interface CoordinateValidationResult {
  isValid: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  error?: string;
  warnings?: string[];
}

export interface PlaceInfo {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  country?: string;
  address?: string;
  placeId?: string;
}

class CoordinateValidationService {
  private readonly minLat = -90;
  private readonly maxLat = 90;
  private readonly minLng = -180;
  private readonly maxLng = 180;

  /**
   * Validate coordinates
   */
  validateCoordinates(lat: number, lng: number): CoordinateValidationResult {
    const warnings: string[] = [];
    
    // Check if coordinates are numbers
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return {
        isValid: false,
        error: 'Coordinates must be valid numbers'
      };
    }

    // Check if coordinates are NaN
    if (isNaN(lat) || isNaN(lng)) {
      return {
        isValid: false,
        error: 'Coordinates cannot be NaN'
      };
    }

    // Check latitude bounds
    if (lat < this.minLat || lat > this.maxLat) {
      return {
        isValid: false,
        error: `Latitude must be between ${this.minLat} and ${this.maxLat}`
      };
    }

    // Check longitude bounds
    if (lng < this.minLng || lng > this.maxLng) {
      return {
        isValid: false,
        error: `Longitude must be between ${this.minLng} and ${this.maxLng}`
      };
    }

    // Check for suspicious coordinates (0,0 or very close to it)
    if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) {
      warnings.push('Coordinates are very close to (0,0) which may indicate invalid data');
    }

    // Check for coordinates in the middle of oceans (suspicious)
    if (this.isInOcean(lat, lng)) {
      warnings.push('Coordinates appear to be in the middle of an ocean');
    }

    return {
      isValid: true,
      coordinates: { lat, lng },
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate and geocode a place name
   */
  async validateAndGeocodePlace(placeName: string): Promise<CoordinateValidationResult> {
    try {
      // Use Nominatim (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        return {
          isValid: false,
          error: `Place "${placeName}" not found`
        };
      }
      
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      const validation = this.validateCoordinates(lat, lng);
      
      if (validation.isValid) {
        return {
          isValid: true,
          coordinates: { lat, lng },
          warnings: validation.warnings
        };
      } else {
        return validation;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        isValid: false,
        error: 'Geocoding service unavailable'
      };
    }
  }

  /**
   * Validate coordinates in a trip plan
   */
  validateTripPlanCoordinates(tripPlan: any): {
    validCoordinates: PlaceInfo[];
    invalidCoordinates: Array<{ name: string; error: string }>;
    warnings: string[];
  } {
    const validCoordinates: PlaceInfo[] = [];
    const invalidCoordinates: Array<{ name: string; error: string }> = [];
    const warnings: string[] = [];

    // Validate destination coordinates
    if (tripPlan.destination?.coordinates) {
      const validation = this.validateCoordinates(
        tripPlan.destination.coordinates.lat,
        tripPlan.destination.coordinates.lng
      );
      
      if (validation.isValid) {
        validCoordinates.push({
          name: tripPlan.destination.name || 'Destination',
          coordinates: validation.coordinates!,
          country: tripPlan.destination.country
        });
        
        if (validation.warnings) {
          warnings.push(...validation.warnings);
        }
      } else {
        invalidCoordinates.push({
          name: tripPlan.destination.name || 'Destination',
          error: validation.error!
        });
      }
    }

    // Validate accommodation coordinates
    if (tripPlan.accommodation?.coordinates) {
      const validation = this.validateCoordinates(
        tripPlan.accommodation.coordinates.lat,
        tripPlan.accommodation.coordinates.lng
      );
      
      if (validation.isValid) {
        validCoordinates.push({
          name: tripPlan.accommodation.name || 'Accommodation',
          coordinates: validation.coordinates!,
          address: tripPlan.accommodation.address
        });
        
        if (validation.warnings) {
          warnings.push(...validation.warnings);
        }
      } else {
        invalidCoordinates.push({
          name: tripPlan.accommodation.name || 'Accommodation',
          error: validation.error!
        });
      }
    }

    // Validate itinerary activity coordinates
    if (tripPlan.itinerary && Array.isArray(tripPlan.itinerary)) {
      tripPlan.itinerary.forEach((day: any, dayIndex: number) => {
        if (day.activities && Array.isArray(day.activities)) {
          day.activities.forEach((activity: any, activityIndex: number) => {
            if (activity.coordinates) {
              const validation = this.validateCoordinates(
                activity.coordinates.lat,
                activity.coordinates.lng
              );
              
              if (validation.isValid) {
                validCoordinates.push({
                  name: activity.activity || activity.location || `Day ${dayIndex + 1} Activity ${activityIndex + 1}`,
                  coordinates: validation.coordinates!,
                  address: activity.address
                });
                
                if (validation.warnings) {
                  warnings.push(...validation.warnings);
                }
              } else {
                invalidCoordinates.push({
                  name: activity.activity || activity.location || `Day ${dayIndex + 1} Activity ${activityIndex + 1}`,
                  error: validation.error!
                });
              }
            }
          });
        }
      });
    }

    // Validate restaurant coordinates
    if (tripPlan.foodGuide?.recommendedRestaurants && Array.isArray(tripPlan.foodGuide.recommendedRestaurants)) {
      tripPlan.foodGuide.recommendedRestaurants.forEach((restaurant: any, index: number) => {
        if (restaurant.coordinates) {
          const validation = this.validateCoordinates(
            restaurant.coordinates.lat,
            restaurant.coordinates.lng
          );
          
          if (validation.isValid) {
            validCoordinates.push({
              name: restaurant.name || `Restaurant ${index + 1}`,
              coordinates: validation.coordinates!,
              address: restaurant.address
            });
            
            if (validation.warnings) {
              warnings.push(...validation.warnings);
            }
          } else {
            invalidCoordinates.push({
              name: restaurant.name || `Restaurant ${index + 1}`,
              error: validation.error!
            });
          }
        }
      });
    }

    return {
      validCoordinates,
      invalidCoordinates,
      warnings
    };
  }

  /**
   * Check if coordinates are in the middle of an ocean
   */
  private isInOcean(lat: number, lng: number): boolean {
    // Simple heuristic: check if coordinates are in known ocean areas
    // This is a basic implementation - in production, you'd use a more sophisticated method
    
    // Pacific Ocean
    if (lat > -60 && lat < 60 && lng > 120 && lng < -120) {
      return true;
    }
    
    // Atlantic Ocean
    if (lat > -60 && lat < 60 && lng > -80 && lng < 20) {
      return true;
    }
    
    // Indian Ocean
    if (lat > -60 && lat < 30 && lng > 20 && lng < 120) {
      return true;
    }
    
    return false;
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(lat: number, lng: number, precision: number = 6): string {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get coordinates for a city center (fallback)
   */
  getCityCenterCoordinates(cityName: string): { lat: number; lng: number } | null {
    // Fallback coordinates for major cities
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'dubai': { lat: 25.2048, lng: 55.2708 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'singapore': { lat: 1.3521, lng: 103.8198 },
      'rome': { lat: 41.9028, lng: 12.4964 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'bangkok': { lat: 13.7563, lng: 100.5018 },
      'istanbul': { lat: 41.0082, lng: 28.9784 }
    };
    
    return cityCoordinates[cityName.toLowerCase()] || null;
  }
}

// Export as default instance
const coordinateValidationService = new CoordinateValidationService();
export default coordinateValidationService;
