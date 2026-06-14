import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Calendar, Clock, DollarSign, Plane, Building, Utensils, Car } from 'lucide-react';
import { findLocationCoordinates, logCoordinateResolution } from '@/utils/coordinateUtils';
import 'leaflet/dist/leaflet.css';
import './LeafletMap.css';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  name: string;
  lat: number;
  lng: number;
  day?: number;
  time?: string;
  activity?: string;
  duration?: string;
  cost?: string;
  type: 'destination' | 'activity' | 'accommodation' | 'restaurant' | 'transport';
  address?: string;
}

interface LeafletTripMapProps {
  tripPlan: any;
}

// Create custom colored icons for different location types
const createCustomIcon = (color: string, day?: number) => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-weight: bold;
      color: white;
      font-size: 12px;
    ">
      ${day || '📍'}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Map bounds adjustment component
const MapBoundsUpdater: React.FC<{ locations: Location[] }> = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [locations, map]);

  return null;
};

const LeafletTripMap: React.FC<LeafletTripMapProps> = ({ tripPlan }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.2048, 55.2708]); // Default to Dubai

  // Extract and map locations from trip plan
  useEffect(() => {
    const extractLocations = () => {
      const extractedLocations: Location[] = [];

      // Helper function to find coordinates
      const findCoordinates = (locationName: string, providedCoords?: { lat: number; lng: number }): { lat: number; lng: number } | null => {
        const destCountry = typeof tripPlan.destination === 'object' ? tripPlan.destination.country : undefined;
        const result = findLocationCoordinates(locationName, providedCoords, destCountry);
        
        // Log for debugging and monitoring
        logCoordinateResolution(locationName, result);
        
        return { lat: result.lat, lng: result.lng };
      };

      try {
        // Add destination as main point
        if (tripPlan.destination) {
          const dest = typeof tripPlan.destination === 'string' ? tripPlan.destination : tripPlan.destination.name;
          const destCoords = typeof tripPlan.destination === 'object' ? tripPlan.destination.coordinates : undefined;
          
          if (dest) {
            const coords = findCoordinates(dest, destCoords);
            if (coords) {
              extractedLocations.push({
                name: dest,
                lat: coords.lat,
                lng: coords.lng,
                type: 'destination'
              });
              setMapCenter([coords.lat, coords.lng]);
            }
          }
        }

        // Extract locations from itinerary
        if (tripPlan.itinerary && Array.isArray(tripPlan.itinerary)) {
          for (const day of tripPlan.itinerary) {
            if (day.activities && Array.isArray(day.activities)) {
              for (const activity of day.activities) {
                if (activity.location) {
                  const coords = findCoordinates(activity.location, activity.coordinates);
                  if (coords) {
                    extractedLocations.push({
                      name: activity.location,
                      lat: coords.lat,
                      lng: coords.lng,
                      day: day.day,
                      time: activity.time,
                      activity: activity.activity,
                      duration: activity.duration,
                      cost: activity.cost,
                      type: 'activity',
                      address: activity.address
                    });
                  }
                }
              }
            }
          }
        }

        // Add accommodation location
        if (tripPlan.accommodation?.location) {
          const coords = findCoordinates(tripPlan.accommodation.location, tripPlan.accommodation.coordinates);
          if (coords) {
            extractedLocations.push({
              name: tripPlan.accommodation.name || 'Hotel',
              lat: coords.lat,
              lng: coords.lng,
              type: 'accommodation',
              address: tripPlan.accommodation.address || tripPlan.accommodation.location
            });
          }
        }

        // Add restaurant locations from food recommendations
        if (tripPlan.foodGuide?.recommendedRestaurants && Array.isArray(tripPlan.foodGuide.recommendedRestaurants)) {
          for (const restaurant of tripPlan.foodGuide.recommendedRestaurants) {
            if (restaurant.location) {
              const coords = findCoordinates(restaurant.location, restaurant.coordinates);
              if (coords) {
                extractedLocations.push({
                  name: restaurant.name || restaurant.location,
                  lat: coords.lat,
                  lng: coords.lng,
                  type: 'restaurant',
                  cost: restaurant.priceRange || restaurant.cost,
                  address: restaurant.address
                });
              }
            }
          }
        }

        setLocations(extractedLocations);
      } catch (error) {
        console.error('Error extracting locations:', error);
      }
    };

    extractLocations();
  }, [tripPlan]);

  // Generate route lines between consecutive day locations
  const dayRoutes = useMemo(() => {
    const routes: Array<{ path: [number, number][]; color: string; day: number }> = [];
    
    // Group locations by day
    const locationsByDay = locations
      .filter(loc => loc.day)
      .reduce((acc, loc) => {
        const day = loc.day!;
        if (!acc[day]) acc[day] = [];
        acc[day].push(loc);
        return acc;
      }, {} as Record<number, Location[]>);

    // Create routes for each day with multiple locations
    Object.entries(locationsByDay).forEach(([dayStr, dayLocations]) => {
      const day = parseInt(dayStr);
      if (dayLocations.length > 1) {
        const path = dayLocations.map(loc => [loc.lat, loc.lng] as [number, number]);
        const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
        routes.push({
          path,
          color: colors[day % colors.length],
          day
        });
      }
    });

    return routes;
  }, [locations]);

  const getLocationColor = (type: string) => {
    switch (type) {
      case 'destination': return '#3B82F6'; // Blue
      case 'activity': return '#10B981'; // Green
      case 'accommodation': return '#8B5CF6'; // Purple
      case 'restaurant': return '#F59E0B'; // Orange
      case 'transport': return '#6366F1'; // Indigo
      default: return '#6B7280'; // Gray
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'destination': return <Plane className="h-4 w-4" />;
      case 'activity': return <MapPin className="h-4 w-4" />;
      case 'accommodation': return <Building className="h-4 w-4" />;
      case 'restaurant': return <Utensils className="h-4 w-4" />;
      case 'transport': return <Car className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Map Container */}
      <div className="flex-1 relative">
        <div className="w-full h-64 lg:h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            className="rounded-xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Update map bounds when locations change */}
            <MapBoundsUpdater locations={locations} />
            
            {/* Location markers */}
            {locations.map((location, index) => (
              <Marker
                key={index}
                position={[location.lat, location.lng]}
                icon={createCustomIcon(getLocationColor(location.type), location.day)}
                eventHandlers={{
                  click: () => setSelectedLocation(location)
                }}
              >
                <Popup>
                  <div className="max-w-xs p-2">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="text-blue-600 dark:text-blue-400">
                        {getLocationIcon(location.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                          {location.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize mb-2">
                          {location.type}
                        </p>
                      </div>
                      {location.day && (
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          Day {location.day}
                        </span>
                      )}
                    </div>
                    
                    {location.activity && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {location.activity}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {location.time && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span>{location.time}</span>
                        </div>
                      )}
                      {location.duration && (
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-gray-500" />
                          <span>{location.duration}</span>
                        </div>
                      )}
                      {location.cost && (
                        <div className="flex items-center gap-1 col-span-2">
                          <DollarSign className="h-3 w-3 text-gray-500" />
                          <span>{location.cost}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Day routes */}
            {dayRoutes.map((route, index) => (
              <Polyline
                key={index}
                positions={route.path}
                color={route.color}
                weight={3}
                opacity={0.7}
              />
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
            <h4 className="text-sm font-bold mb-2 text-gray-800 dark:text-gray-200">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Destination</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Activities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Hotel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Restaurants</span>
              </div>
            </div>
          </div>

          {/* Map Statistics */}
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Locations:</span>
                <span className="font-bold ml-1 text-blue-600 dark:text-blue-400">{locations.length}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Days:</span>
                <span className="font-bold ml-1 text-blue-600 dark:text-blue-400">
                  {Math.max(...locations.filter(l => l.day).map(l => l.day || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details Panel */}
      <div className="lg:w-80 space-y-4">
        {selectedLocation ? (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                style={{ backgroundColor: getLocationColor(selectedLocation.type) }}
              >
                {selectedLocation.day || '📍'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-800 dark:text-blue-300">{selectedLocation.name}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 capitalize">{selectedLocation.type}</p>
                {selectedLocation.address && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedLocation.address}</p>
                )}
              </div>
            </div>
            
            {selectedLocation.activity && (
              <div className="mb-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Activity</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedLocation.activity}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {selectedLocation.time && (
                <div className="bg-white/70 dark:bg-gray-800/70 p-2 rounded text-center">
                  <Clock className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Time</p>
                  <p className="text-sm font-semibold">{selectedLocation.time}</p>
                </div>
              )}
              
              {selectedLocation.duration && (
                <div className="bg-white/70 dark:bg-gray-800/70 p-2 rounded text-center">
                  <Navigation className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="text-sm font-semibold">{selectedLocation.duration}</p>
                </div>
              )}
              
              {selectedLocation.cost && (
                <div className="bg-white/70 dark:bg-gray-800/70 p-2 rounded text-center col-span-2">
                  <DollarSign className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Cost</p>
                  <p className="text-sm font-semibold">{selectedLocation.cost}</p>
                </div>
              )}
            </div>
            
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
            <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Select a Location</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">Click on any marker on the map to view details about that location.</p>
          </div>
        )}

        {/* Day-by-Day Locations List */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Locations by Day
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Array.from(new Set(locations.filter(l => l.day).map(l => l.day)))
              .sort((a, b) => (a || 0) - (b || 0))
              .map(day => (
                <div key={day} className="border-l-4 border-blue-400 pl-3 py-2">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Day {day}</h4>
                  <div className="space-y-1">
                    {locations
                      .filter(l => l.day === day)
                      .map((location, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedLocation(location)}
                          className="block w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          • {location.name} {location.time && `(${location.time})`}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeafletTripMap;
