import React, { useState } from 'react';
import { Star, MapPin, Wifi, Car, Utensils, Dumbbell, Waves, Coffee } from 'lucide-react';

interface AlternativeHotel {
  name: string;
  type: string;
  location: string;
  pricePerNight: string;
  totalPrice: string;
  rating: string;
  amenities: string[];
  bookingUrl: string;
  whyRecommended: string;
}

interface AlternativeHotelsProps {
  hotels: AlternativeHotel[];
  currency: string;
}

const AlternativeHotels: React.FC<AlternativeHotelsProps> = ({ hotels, currency }) => {
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) {
      return <Wifi className="h-4 w-4" />;
    } else if (amenityLower.includes('parking') || amenityLower.includes('car')) {
      return <Car className="h-4 w-4" />;
    } else if (amenityLower.includes('restaurant') || amenityLower.includes('dining') || amenityLower.includes('food')) {
      return <Utensils className="h-4 w-4" />;
    } else if (amenityLower.includes('gym') || amenityLower.includes('fitness')) {
      return <Dumbbell className="h-4 w-4" />;
    } else if (amenityLower.includes('pool') || amenityLower.includes('swimming')) {
      return <Waves className="h-4 w-4" />;
    } else if (amenityLower.includes('coffee') || amenityLower.includes('cafe')) {
      return <Coffee className="h-4 w-4" />;
    }
    return <Star className="h-4 w-4" />;
  };

  const getRatingColor = (rating: string) => {
    const ratingNum = parseFloat(rating);
    if (ratingNum >= 4.5) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (ratingNum >= 4.0) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    if (ratingNum >= 3.5) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  };

  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Alternative Hotel Options
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotels.map((hotel, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedHotel === index
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setSelectedHotel(selectedHotel === index ? null : index)}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {hotel.name}
                </h4>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(hotel.rating)}`}>
                  {hotel.rating}
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                <span>{hotel.location}</span>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {hotel.type}
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Per Night</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {hotel.pricePerNight}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Stay</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {hotel.totalPrice}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {hotel.amenities.slice(0, 3).map((amenity, amenityIndex) => (
                  <div
                    key={amenityIndex}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                  >
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
                {hotel.amenities.length > 3 && (
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    +{hotel.amenities.length - 3} more
                  </div>
                )}
              </div>
              
              {selectedHotel === index && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {hotel.whyRecommended}
                  </p>
                  <a
                    href={hotel.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book Now
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlternativeHotels;
