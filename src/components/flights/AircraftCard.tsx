import React, { useState, useEffect } from 'react';

interface AircraftInfo {
  type: string;
  manufacturer?: string;
  registration?: string;
  hexCode?: string;
  iataCode?: string;
  icaoCode?: string;
  source?: string;
  age?: string;
  msn?: string;
  firstFlight?: string;
}

interface AircraftCardProps {
  aircraft: AircraftInfo;
}

const AircraftCard: React.FC<AircraftCardProps> = ({ aircraft }) => {
  const [aircraftPhoto, setAircraftPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Fetch aircraft photo from PlaneSpotters API
  useEffect(() => {
    const fetchAircraftPhoto = async () => {
      if (!aircraft.registration && !aircraft.hexCode) return;
      
      setPhotoLoading(true);
      try {
        let apiUrl = '';
        if (aircraft.registration) {
          apiUrl = `https://api.planespotters.net/pub/photos/reg/${aircraft.registration}`;
        } else if (aircraft.hexCode) {
          apiUrl = `https://api.planespotters.net/pub/photos/hex/${aircraft.hexCode}`;
        }
        
        if (apiUrl) {
          const response = await fetch(apiUrl);
          const data = await response.json();
          
          if (data.photos && data.photos.length > 0) {
            // Use the latest photo (first in array)
            const latestPhoto = data.photos[0];
            setAircraftPhoto(latestPhoto.thumbnail_large?.src || latestPhoto.thumbnail?.src);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch aircraft photo:', error);
      } finally {
        setPhotoLoading(false);
      }
    };

    fetchAircraftPhoto();
  }, [aircraft.registration, aircraft.hexCode]);

  const getAircraftIcon = (type: string) => {
    const typeUpper = type.toUpperCase();
    if (typeUpper.includes('A3') || typeUpper.includes('A2') || typeUpper.includes('A1')) return '🛩️';
    if (typeUpper.includes('B7') || typeUpper.includes('B6') || typeUpper.includes('B5')) return '✈️';
    if (typeUpper.includes('ATR') || typeUpper.includes('CRJ') || typeUpper.includes('ERJ')) return '🛫';
    if (typeUpper.includes('DH') || typeUpper.includes('DHC')) return '🛩️';
    if (typeUpper.includes('MI') || typeUpper.includes('SU')) return '🛩️';
    if (typeUpper.includes('IL') || typeUpper.includes('TU')) return '🛩️';
    if (typeUpper.includes('YAK') || typeUpper.includes('AN')) return '🛩️';
    if (typeUpper.includes('C') || typeUpper.includes('B')) return '🛩️';
    if (typeUpper.includes('H') || typeUpper.includes('Z')) return '🚁';
    return '✈️';
  };

  const getManufacturerColor = (manufacturer: string) => {
    const mfr = manufacturer.toLowerCase();
    if (mfr.includes('airbus')) return 'text-blue-600 dark:text-blue-400';
    if (mfr.includes('boeing')) return 'text-red-600 dark:text-red-400';
    if (mfr.includes('bombardier')) return 'text-green-600 dark:text-green-400';
    if (mfr.includes('embraer')) return 'text-yellow-600 dark:text-yellow-400';
    if (mfr.includes('atr')) return 'text-purple-600 dark:text-purple-400';
    if (mfr.includes('antonov')) return 'text-indigo-600 dark:text-indigo-400';
    if (mfr.includes('tupolev')) return 'text-pink-600 dark:text-pink-400';
    if (mfr.includes('ilyushin')) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4 mb-6">
        <div className="text-4xl">
          {getAircraftIcon(aircraft.type)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Aircraft Details
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Technical specifications and registration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aircraft Type & Manufacturer */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aircraft Type</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {aircraft.type || 'Unknown'}
            </p>
          </div>

          {aircraft.manufacturer && aircraft.manufacturer !== 'Unknown' && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Manufacturer</p>
              <p className={`text-lg font-semibold ${getManufacturerColor(aircraft.manufacturer)}`}>
                {aircraft.manufacturer}
              </p>
            </div>
          )}

          {aircraft.iataCode && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">IATA Code</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {aircraft.iataCode}
              </p>
            </div>
          )}

          {aircraft.icaoCode && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ICAO Code</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {aircraft.icaoCode}
              </p>
            </div>
          )}
        </div>

        {/* Registration & Hex */}
        <div className="space-y-4">
          {aircraft.registration && aircraft.registration !== 'Unknown' && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Registration</p>
              <div className="flex items-center space-x-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {aircraft.registration}
                </p>
                {/* Source indicator for transparency */}
                {aircraft.source && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {aircraft.source === 'FR24_LIVE_ENRICHED' ? 'Live + Enriched' :
                     aircraft.source === 'FR24_LIVE_HEX_ENRICHED' ? 'Live + Hex Enriched' :
                     aircraft.source === 'FR24_LIVE' ? 'Live Data' : 'Basic Data'}
                  </span>
                )}
                <a
                  href={`https://www.planespotters.net/photo/${aircraft.registration}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                >
                  🔍 Lookup
                </a>
              </div>
            </div>
          )}

          {aircraft.hexCode && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hex Code</p>
              <div className="flex items-center space-x-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                  {aircraft.hexCode}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(aircraft.hexCode!)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
          )}

          {/* Additional Aircraft Details */}
          {(aircraft.age || aircraft.msn || aircraft.firstFlight) && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {aircraft.age && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Age</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {aircraft.age}
                  </p>
                </div>
              )}
              
              {aircraft.msn && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MSN</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                    {aircraft.msn}
                  </p>
                </div>
              )}
              
              {aircraft.firstFlight && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">First Flight</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {aircraft.firstFlight}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Aircraft Image */}
          <div className="mt-4">
            {photoLoading ? (
              <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl mb-2">⏳</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Loading photo...
                  </p>
                </div>
              </div>
            ) : aircraftPhoto ? (
              <div className="w-full h-32 rounded-lg overflow-hidden">
                <img
                  src={aircraftPhoto}
                  alt={`${aircraft.registration || aircraft.hexCode} aircraft`}
                  className="w-full h-full object-cover"
                  onError={() => setAircraftPhoto(null)}
                />
              </div>
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl mb-2">🛩️</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No photo available
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Try searching by registration
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AircraftCard;
