import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FlightMapProps {
  flights: any[];
  height?: string;
  showFlightPaths?: boolean;
  autoCenter?: boolean;
}

export const FlightMap: React.FC<FlightMapProps> = ({ 
  flights, 
  height = '400px', 
  showFlightPaths = true,
  autoCenter = true 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not exists
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([40.7589, -73.9851], 6); // Default to NYC area

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      // Initialize markers layer
      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    // Clear existing markers
    if (markersLayer.current) {
      markersLayer.current.clearLayers();
    }

    const bounds = L.latLngBounds([]);

    flights.forEach((flight) => {
      // Handle different flight data types - check if it's AviationEdgeFlightTracker or CombinedFlightData
      let lat: number | undefined;
      let lng: number | undefined;
      let direction: number = 0;
      let flightNumber: string;
      let airlineName: string;
      let aircraftInfo: string;
      let altitude: number = 0;
      let speed: number = 0;
      let status: string;
      let depIata: string;
      let arrIata: string;
      let depGate: string = '';
      let depTerminal: string = '';
      let arrGate: string = '';
      let arrTerminal: string = '';
      let baggage: string = '';

      // Extract data based on flight type
      if ('geography' in flight && flight.geography) {
        // AviationEdgeFlightTracker type
        lat = flight.geography.latitude;
        lng = flight.geography.longitude;
        direction = flight.geography.direction || 0;
        altitude = flight.geography.altitude || 0;
        speed = flight.speed?.horizontal || 0;
        flightNumber = flight.flight?.iataNumber || flight.flight?.number || 'Unknown';
        airlineName = flight.airline?.name || flight.airline?.iataCode || 'Unknown'; // Use name if available, fallback to code
        aircraftInfo = flight.aircraft?.regNumber || flight.aircraft?.iataCode || 'Unknown';
        depIata = flight.departure?.iataCode || '?';
        arrIata = flight.arrival?.iataCode || '?';
        depGate = flight.departure?.gate || '';
        depTerminal = flight.departure?.terminal || '';
        arrGate = flight.arrival?.gate || '';
        arrTerminal = flight.arrival?.terminal || '';
        baggage = flight.arrival?.baggage || '';
        status = flight.status || 'Unknown';
      } else if ('liveData' in flight && flight.liveData?.position) {
        // CombinedFlightData type with live data
        lat = flight.liveData.position.latitude;
        lng = flight.liveData.position.longitude;
        direction = flight.liveData.position.direction || 0;
        altitude = flight.liveData.position.altitude || 0;
        speed = flight.liveData.position.speed || 0;
        flightNumber = flight.flightIata || flight.flightNumber || 'Unknown';
        airlineName = flight.airline?.name || flight.airline?.iataCode || 'Unknown';
        aircraftInfo = flight.aircraft?.registration || flight.aircraft?.iataCode || 'Unknown';
        depIata = flight.departure?.airportIata || '?';
        arrIata = flight.arrival?.airportIata || '?';
        depGate = flight.departure?.gate || '';
        depTerminal = flight.departure?.terminal || '';
        arrGate = flight.arrival?.gate || '';
        arrTerminal = flight.arrival?.terminal || '';
        baggage = flight.arrival?.baggage || '';
        status = flight.liveData.status || 'Unknown';
      } else {
        // No live position data, skip this flight for map plotting
        return;
      }

      // Only plot if we have valid coordinates
      if (!lat || !lng || lat === 0 || lng === 0) {
        return;
      }

      const aircraftPos = L.latLng(lat, lng);

      // Create custom aircraft icon based on direction
      const aircraftIcon = L.divIcon({
        html: `<div style="transform: rotate(${direction}deg); font-size: 18px; color: #DC2626; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">✈️</div>`,
        className: 'aircraft-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const aircraftMarker = L.marker(aircraftPos, { icon: aircraftIcon });

      // Create professional popup content
      const popupContent = `
        <div style="min-width: 320px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 12px; border-radius: 8px 8px 0 0; margin: -10px -10px 12px -10px;">
            <h3 style="margin: 0; font-size: 20px; font-weight: bold;">${flightNumber}</h3>
            <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">${airlineName}</p>
          </div>
          
          <div style="padding: 0 4px;">
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; margin-bottom: 16px;">
              <div style="text-align: center;">
                <div style="font-size: 24px; color: #059669;">🛫</div>
                <div style="font-weight: bold; font-size: 16px; color: #1f2937;">${depIata}</div>
                ${depTerminal ? `<div style="font-size: 12px; color: #6b7280;">Terminal ${depTerminal}</div>` : ''}
                ${depGate ? `<div style="font-size: 12px; color: #6b7280;">Gate ${depGate}</div>` : ''}
              </div>
              <div style="text-align: center; color: #6b7280;">
                <div style="font-size: 20px;">→</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; color: #dc2626;">🛬</div>
                <div style="font-weight: bold; font-size: 16px; color: #1f2937;">${arrIata}</div>
                ${arrTerminal ? `<div style="font-size: 12px; color: #6b7280;">Terminal ${arrTerminal}</div>` : ''}
                ${arrGate ? `<div style="font-size: 12px; color: #6b7280;">Gate ${arrGate}</div>` : ''}
                ${baggage ? `<div style="font-size: 12px; color: #6b7280;">Baggage ${baggage}</div>` : ''}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
              <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
                <div style="font-weight: bold; color: #374151; font-size: 12px; margin-bottom: 4px;">ALTITUDE</div>
                <div style="font-size: 16px; font-weight: bold; color: #1f2937;">${altitude.toLocaleString()} ft</div>
              </div>
              <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
                <div style="font-weight: bold; color: #374151; font-size: 12px; margin-bottom: 4px;">SPEED</div>
                <div style="font-size: 16px; font-weight: bold; color: #1f2937;">${speed} kt</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
              <div>
                <div style="font-weight: bold; color: #374151; font-size: 12px; margin-bottom: 4px;">AIRCRAFT</div>
                <div style="color: #1f2937; font-size: 14px;">${aircraftInfo}</div>
              </div>
              <div>
                <div style="font-weight: bold; color: #374151; font-size: 12px; margin-bottom: 4px;">STATUS</div>
                <div style="color: #059669; font-weight: bold; font-size: 14px; text-transform: uppercase;">${status}</div>
              </div>
            </div>
          </div>
        </div>
      `;

      aircraftMarker.bindPopup(popupContent, {
        maxWidth: 350,
        className: 'custom-popup'
      });

      if (markersLayer.current) {
        aircraftMarker.addTo(markersLayer.current);
      }

      bounds.extend(aircraftPos);
    });

    // Auto-center map to show all markers
    if (autoCenter && bounds.isValid() && mapInstance.current) {
      mapInstance.current.fitBounds(bounds, { padding: [20, 20] });
    }

    // Cleanup function
    return () => {
      // Don't destroy the map instance, just clear markers
    };
  }, [flights, showFlightPaths, autoCenter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
      />
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 text-sm">
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Map Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span>✈️</span>
            <span className="text-gray-700 dark:text-gray-300">Live Aircraft</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🛫</span>
            <span className="text-gray-700 dark:text-gray-300">Departure</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🛬</span>
            <span className="text-gray-700 dark:text-gray-300">Arrival</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500 opacity-60" style={{borderTop: '1px dashed #3B82F6'}}></div>
            <span className="text-gray-700 dark:text-gray-300">Flight Path</span>
          </div>
        </div>
      </div>

      {/* Flight Count */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 text-sm">
        <span className="font-semibold text-gray-900 dark:text-white">
          {flights.filter(f => f.geography?.latitude && f.geography?.longitude).length} Live Flights
        </span>
      </div>
    </div>
  );
};

export default FlightMap;
