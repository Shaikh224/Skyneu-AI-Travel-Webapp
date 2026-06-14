import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Flight } from '@/types/flightTypes';
import { createFlightIcon, createAirportIcon, createFlightPath, fitMapToBounds } from '@/utils/mapUtils';

export const useFlightMap = (mapRef: React.RefObject<L.Map | null>) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const [paths, setPaths] = useState<L.Polyline[]>([]);
  const [airportMarkers, setAirportMarkers] = useState<{ origin: L.Marker | null; destination: L.Marker | null }>({
    origin: null,
    destination: null,
  });

  // Initialize map when the component mounts
  useEffect(() => {
    if (mapRef.current && !map) {
      setMap(mapRef.current);
    }
  }, [mapRef, map]);

  // Clear all markers and paths
  const clearMap = useCallback(() => {
    markers.forEach((marker) => marker.remove());
    paths.forEach((path) => path.remove());
    if (airportMarkers.origin) airportMarkers.origin.remove();
    if (airportMarkers.destination) airportMarkers.destination.remove();
    
    setMarkers([]);
    setPaths([]);
    setAirportMarkers({ origin: null, destination: null });
  }, [markers, paths, airportMarkers]);

  // Update flight markers on the map
  const updateFlightMarkers = useCallback(
    (flights: Flight[], selectedFlightId?: string) => {
      if (!map) return;

      // Clear existing markers and paths
      clearMap();

      const newMarkers: L.Marker[] = [];
      const newPaths: L.Polyline[] = [];

      flights.forEach((flight) => {
        const isSelected = flight.id === selectedFlightId;
        const position = flight.progress?.position || {
          lat: flight.route[0]?.lat || 0,
          lng: flight.route[0]?.lng || 0,
        };

        // Create flight marker
        const marker = L.marker([position.lat, position.lng], {
          icon: createFlightIcon(isSelected, flight.status),
          zIndexOffset: isSelected ? 1000 : 0,
        });

        // Add popup with flight info
        const popupContent = `
          <div class="p-2">
            <div class="font-bold">${flight.airline} ${flight.flightNumber}</div>
            <div>From: ${flight.origin}</div>
            <div>To: ${flight.destination}</div>
            <div>Status: ${flight.status}</div>
            ${flight.progress ? `<div>Progress: ${Math.round(flight.progress.percentage)}%</div>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        newMarkers.push(marker);

        // Create flight path if we have a route
        if (flight.route && flight.route.length > 1) {
          const path = createFlightPath(flight.route);
          path.addTo(map);
          newPaths.push(path);
        }
      });

      setMarkers(newMarkers);
      setPaths(newPaths);

      // Fit map to bounds if we have flights
      if (flights.length > 0) {
        const coordinates = flights.flatMap((flight) => 
          flight.route || []
        );
        
        if (coordinates.length > 0) {
          fitMapToBounds(map, coordinates);
        }
      }
    },
    [map, clearMap]
  );

  // Show airport markers for a specific flight
  const showAirportMarkers = useCallback(
    (flight: Flight) => {
      if (!map) return;

      // Clear existing airport markers
      if (airportMarkers.origin) airportMarkers.origin.remove();
      if (airportMarkers.destination) airportMarkers.destination.remove();

      if (!flight.route || flight.route.length < 2) return;

      const origin = flight.route[0];
      const destination = flight.route[flight.route.length - 1];

      // Create origin marker
      const originMarker = L.marker([origin.lat, origin.lng], {
        icon: createAirportIcon(true),
        zIndexOffset: 500,
      });

      // Create destination marker
      const destMarker = L.marker([destination.lat, destination.lng], {
        icon: createAirportIcon(false),
        zIndexOffset: 500,
      });

      originMarker
        .bindPopup(`<div class="p-2"><strong>Origin:</strong> ${flight.origin}</div>`)
        .addTo(map);

      destMarker
        .bindPopup(`<div class="p-2"><strong>Destination:</strong> ${flight.destination}</div>`)
        .addTo(map);

      setAirportMarkers({
        origin: originMarker,
        destination: destMarker,
      });

      // Fit map to show both airports with some padding
      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds.pad(0.2));
    },
    [map, airportMarkers]
  );

  // Update flight position smoothly
  const updateFlightPosition = useCallback(
    (flightId: string, newPosition: { lat: number; lng: number; heading: number }) => {
      if (!map) return;

      const marker = markers.find((m) => m.getPopup()?.getContent().includes(flightId));
      if (marker) {
        marker.setLatLng([newPosition.lat, newPosition.lng]);
        
        // Update rotation if heading is provided
        // @ts-ignore - setRotation is a custom method from the rotation plugin
        if (marker.setRotation && newPosition.heading !== undefined) {
          // @ts-ignore
          marker.setRotation(newPosition.heading);
        }
      }
    },
    [map, markers]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearMap();
    };
  }, [clearMap]);

  return {
    map,
    updateFlightMarkers,
    showAirportMarkers,
    updateFlightPosition,
    clearMap,
  };
};

export default useFlightMap;
