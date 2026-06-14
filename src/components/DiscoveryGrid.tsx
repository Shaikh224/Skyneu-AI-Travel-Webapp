import React, { useState, useEffect, useRef } from 'react';
import { HeartIcon, MapPinIcon, ShareIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import { DiscoveryPlace } from '@/services/discoveryService';

interface DiscoveryGridProps {
  places: DiscoveryPlace[];
  onPlaceSelect: (index: number) => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
}

const DiscoveryGrid: React.FC<DiscoveryGridProps> = ({ 
  places, 
  onPlaceSelect, 
  onLoadMore, 
  loadingMore = false, 
  hasMore = true 
}) => {
  const [likedPlaces, setLikedPlaces] = useState<Set<string>>(new Set());
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(new Set());
  const observerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  const toggleLike = (placeId: string) => {
    setLikedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const toggleSave = (placeId: string) => {
    setSavedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };


  const handleShare = async (place: DiscoveryPlace) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place.title,
          text: place.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${place.title} - ${place.description}`);
    }
  };

  if (!places || places.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No places found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto p-4">
      {places.map((place, index) => {
        return (
          <div
            key={place.id || index}
            className="bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden hover:shadow-xl transition-shadow duration-300"
            onClick={() => onPlaceSelect(index)}
          >
            {/* Image */}
            {place.imageUrl && (
              <div className="relative h-48 w-full">
                <img 
                  src={place.imageUrl} 
                  alt={place.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Mood Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-skyneu-blue/90 text-white rounded-full text-sm font-medium">
                    {place.mood?.charAt(0).toUpperCase() + place.mood?.slice(1)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <MapPinIcon className="w-4 h-4" />
                <span>{place.location}</span>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-skyneu-dark dark:text-dark-text line-clamp-2">
                {place.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {place.description}
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(place.id);
                  }}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {likedPlaces.has(place.id) ? (
                    <HeartSolid className="w-4 h-4 text-red-500" />
                  ) : (
                    <HeartIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(place.id);
                  }}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {savedPlaces.has(place.id) ? (
                    <BookmarkSolid className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <BookmarkIcon className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(place);
                  }}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <ShareIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* Photographer Credit */}
              {place.photographer && (
                <div className="text-xs text-gray-400">
                  Photo by {place.photographer}
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerRef} className="flex justify-center py-4">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-skyneu-blue rounded-full animate-spin"></div>
              <span>Loading more places...</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Scroll to load more</div>
          )}
        </div>
      )}
      
      {/* End of results */}
      {!hasMore && places.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of the results</p>
        </div>
      )}
    </div>
  );
};

export default DiscoveryGrid;
