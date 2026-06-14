/**
 * Flight Map Component
 * Displays live flight position on an interactive map
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import './FlightMap.css';
import { UnifiedFlightData } from '@/services/flightTracking/unifiedFlightTracker';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FlightMapProps {
  flight: UnifiedFlightData;
}

// Custom plane icon
const createPlaneIcon = (heading: number) => {
  return L.divIcon({
    html: `
      <div style="transform: rotate(${heading}deg); transform-origin: center;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Aircraft body -->
          <path d="M12 2L19 21L12 17L5 21L12 2Z" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5"/>
          <!-- Aircraft highlight -->
          <path d="M12 2L16 18L12 15L8 18L12 2Z" fill="#3B82F6"/>
          <!-- Cockpit -->
          <circle cx="12" cy="6" r="1.5" fill="#ffffff" opacity="0.8"/>
        </svg>
        <!-- Live indicator -->
        <div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #10B981; border-radius: 50%; border: 1px solid white;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: 'plane-icon'
  });
};

// Airport icon
const airportIcon = L.divIcon({
  html: `
    <div class="airport-marker">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#10B981" stroke="#059669" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  className: 'airport-icon'
});

// Map controller component
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

const FlightMap: React.FC<FlightMapProps> = ({ flight }) => {
  const mapRef = useRef<L.Map | null>(null);

  // Get airport coordinates from flight data or fallback to common airports
  const getAirportCoordinates = (iataCode: string): [number, number] | null => {
    if (!iataCode) return null;
    
    // First try to get coordinates from flight data
    if (iataCode === flight.schedule.departure.airport) {
      // Try to extract from flight data if available
      // This would be populated by Aviation Edge airport data
    }
    
    // Fallback to common airports database
    const airports: Record<string, [number, number]> = {
      // Middle East
      'DXB': [25.2532, 55.3657], // Dubai International
      'JED': [21.6796, 39.1567], // King Abdulaziz International
      'DOH': [25.2731, 51.6080], // Hamad International
      'AUH': [24.4330, 54.6511], // Abu Dhabi International
      'KWI': [29.2267, 47.9687], // Kuwait International
      'RUH': [24.9574, 46.6988], // King Khalid International
      
      // India
      'DEL': [28.5562, 77.1000], // Indira Gandhi International
      'BOM': [19.0896, 72.8656], // Chhatrapati Shivaji
      'BLR': [13.1986, 77.7066], // Kempegowda International
      'MAA': [12.9941, 80.1709], // Chennai International
      'CCU': [22.6547, 88.4467], // Netaji Subhash Chandra Bose
      'HYD': [17.2313, 78.4298], // Rajiv Gandhi International
      
      // Major International
      'JFK': [40.6413, -73.7781], // New York JFK
      'LAX': [33.9425, -118.4081], // Los Angeles
      'LHR': [51.4700, -0.4543], // London Heathrow
      'CDG': [49.0097, 2.5479], // Paris Charles de Gaulle
      'SIN': [1.3644, 103.9915], // Singapore Changi
      'HKG': [22.3080, 113.9185], // Hong Kong
      'NRT': [35.7720, 140.3929], // Tokyo Narita
      'SYD': [-33.9399, 151.1753], // Sydney
      'FRA': [50.0379, 8.5622], // Frankfurt
      'AMS': [52.3105, 4.7683], // Amsterdam Schiphol
      'ICN': [37.4602, 126.4407], // Seoul Incheon
      'PEK': [40.0799, 116.6031], // Beijing Capital
      
      // Add more as needed
    };
    
    const coords = airports[iataCode.toUpperCase()];
    if (coords) {
      return coords;
    }
    
    return null;
  };

  const departureCoords = useMemo(() => {
    const coords = getAirportCoordinates(flight.schedule.departure.iataCode || flight.schedule.departure.airport);
    return coords;
  }, [flight.schedule.departure.iataCode, flight.schedule.departure.airport]);

  const arrivalCoords = useMemo(() => {
    const coords = getAirportCoordinates(flight.schedule.arrival.iataCode || flight.schedule.arrival.airport);
    return coords;
  }, [flight.schedule.arrival.iataCode, flight.schedule.arrival.airport]);
  
  // Calculate map center and zoom
  const getMapConfig = () => {
    if (flight.position && 
        typeof flight.position.latitude === 'number' && 
        typeof flight.position.longitude === 'number' &&
        !isNaN(flight.position.latitude) && 
        !isNaN(flight.position.longitude)) {
      // Center on current position
      return {
        center: [flight.position.latitude, flight.position.longitude] as [number, number],
        zoom: 6
      };
    } else if (departureCoords && arrivalCoords) {
      // Center between departure and arrival
      return {
        center: [
          (departureCoords[0] + arrivalCoords[0]) / 2,
          (departureCoords[1] + arrivalCoords[1]) / 2
        ] as [number, number],
        zoom: 4
      };
    } else {
      // Default world view
      return {
        center: [20, 0] as [number, number],
        zoom: 2
      };
    }
  };

  const { center, zoom } = getMapConfig();

  // Create flight path
  const flightPath: [number, number][] = [];
  if (departureCoords) flightPath.push(departureCoords);
  if (flight.position && 
      typeof flight.position.latitude === 'number' && 
      typeof flight.position.longitude === 'number' &&
      !isNaN(flight.position.latitude) && 
      !isNaN(flight.position.longitude)) {
    flightPath.push([flight.position.latitude, flight.position.longitude]);
  }
  if (arrivalCoords && !flight.position) {
    flightPath.push(arrivalCoords);
  }

  // Create track history if available
  const trackHistory: [number, number][] = flight.tracks?.filter(track => 
    typeof track.lat === 'number' && 
    typeof track.lon === 'number' &&
    !isNaN(track.lat) && 
    !isNaN(track.lon)
  ).map(track => [track.lat, track.lon]) || [];



  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          🗺️ Flight Map
          {flight.isLive && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </h3>
      </div>
      
      <div className="h-[500px] relative">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapController center={center} zoom={zoom} />
          
          {/* Departure Airport */}
          {departureCoords && (
            <Marker position={departureCoords} icon={airportIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Departure</strong><br />
                  {flight.schedule.departure.airport}<br />
                  ({flight.schedule.departure.iataCode})
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Arrival Airport */}
          {arrivalCoords && (
            <Marker position={arrivalCoords} icon={airportIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Arrival</strong><br />
                  {flight.schedule.arrival.airport}<br />
                  ({flight.schedule.arrival.iataCode})
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Current Position */}
          {flight.position && 
           typeof flight.position.latitude === 'number' && 
           typeof flight.position.longitude === 'number' &&
           !isNaN(flight.position.latitude) && 
           !isNaN(flight.position.longitude) && (
            <Marker 
              position={[flight.position.latitude, flight.position.longitude]} 
              icon={createPlaneIcon(flight.position.heading)}
            >
              <Popup className="aircraft-popup">
                <div className="text-sm space-y-2">
                  <div className="font-bold text-blue-600 text-base">
                    ✈️ {flight.flightNumber}
                  </div>
                  <div className="text-gray-700">
                    <strong>{flight.airline.name}</strong>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Altitude:</span><br />
                      <span className="font-semibold">{flight.position.altitude?.toLocaleString() || 'N/A'} ft</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Speed:</span><br />
                      <span className="font-semibold">{flight.position.speed || flight.position.groundSpeed || 'N/A'} kts</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Heading:</span><br />
                      <span className="font-semibold">{flight.position.heading || 'N/A'}°</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span><br />
                      <span className={`font-semibold ${flight.status === 'en-route' ? 'text-green-600' : flight.status === 'landed' ? 'text-gray-600' : 'text-blue-600'}`}>
                        {flight.status || 'Live'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 border-t pt-1">
                    Route: {flight.schedule.departure.airport} → {flight.schedule.arrival.airport}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          

          
          {/* Planned Route (Great Circle) */}
          {departureCoords && arrivalCoords && (
            <Polyline 
              positions={[departureCoords, arrivalCoords]}
              color="#94A3B8"
              weight={2}
              opacity={0.4}
              dashArray="15, 10"
            />
          )}
          
          {/* Flight Path (Actual Route with Current Position) */}
          {flightPath.length > 1 && (
            <Polyline 
              positions={flightPath}
              color="#3B82F6"
              weight={3}
              opacity={0.8}
            />
          )}
          
          {/* Track History (Past Route) */}
          {trackHistory.length > 1 && (
            <Polyline 
              positions={trackHistory}
              color="#10B981"
              weight={2}
              opacity={0.7}
            />
          )}
        </MapContainer>
        
        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000]">
          <div className="text-xs space-y-1">
            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="dark:text-gray-300">Airports</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 transform rotate-45"></div>
              <span className="dark:text-gray-300">Aircraft</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t-2 border-gray-400 border-dashed"></div>
              <span className="dark:text-gray-300">Planned Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t-3 border-blue-500"></div>
              <span className="dark:text-gray-300">Flight Path</span>
            </div>
            {trackHistory.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-8 border-t-2 border-green-500"></div>
                <span className="dark:text-gray-300">Track History</span>
              </div>
            )}

            {flight.isLive && (
              <div className="flex items-center gap-2 mt-2 pt-1 border-t border-gray-200 dark:border-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-600 dark:text-green-400 font-medium">Live Tracking</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightMap;
