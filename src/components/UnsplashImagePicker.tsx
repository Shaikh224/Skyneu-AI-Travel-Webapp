import React, { useState, useEffect } from 'react';
import { Search, X, Download, Camera } from 'lucide-react';

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

interface UnsplashImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string) => void;
  searchQuery?: string;
}

const UnsplashImagePicker: React.FC<UnsplashImagePickerProps> = ({
  isOpen,
  onClose,
  onImageSelect,
  searchQuery: initialSearchQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update search query when prop changes and auto-search
  useEffect(() => {
    setSearchQuery(initialSearchQuery);
    if (initialSearchQuery.trim() && isOpen) {
      searchImages();
    }
  }, [initialSearchQuery, isOpen]);

  // Sample placeholder images for demo purposes
  const sampleImages: UnsplashImage[] = [
    {
      id: '1',
      urls: {
        small: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        regular: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
        full: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200'
      },
      alt_description: 'Beautiful mountain landscape',
      user: { name: 'John Doe' }
    },
    {
      id: '2',
      urls: {
        small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        full: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'
      },
      alt_description: 'Ocean waves',
      user: { name: 'Jane Smith' }
    },
    {
      id: '3',
      urls: {
        small: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400',
        regular: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
        full: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200'
      },
      alt_description: 'Forest trail',
      user: { name: 'Bob Wilson' }
    }
  ];

  const searchImages = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      if (!apiKey) {
        console.warn('Unsplash API key not configured, using sample images');
        setImages(sampleImages);
        return;
      }

      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&per_page=12&client_id=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const unsplashImages: UnsplashImage[] = data.results.map((photo: any) => ({
          id: photo.id,
          urls: {
            small: photo.urls.small,
            regular: photo.urls.regular,
            full: photo.urls.full
          },
          alt_description: photo.alt_description || 'Travel image',
          user: { 
            name: photo.user.name || 'Unsplash User',
            links: { html: photo.user.links?.html || 'https://unsplash.com' }
          }
        }));
        setImages(unsplashImages);
      } else {
        // Fallback to sample images if no results
        setImages(sampleImages);
      }
    } catch (err) {
      console.error('Error searching Unsplash:', err);
      setError('Failed to search images');
      // Fallback to sample images on error
      setImages(sampleImages);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (image: UnsplashImage) => {
    onImageSelect(image.urls.regular);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Choose Travel Image
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search for travel images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchImages()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={searchImages}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden"
                  onClick={() => handleImageSelect(image)}
                >
                  <img
                    src={image.urls.small}
                    alt={image.alt_description}
                    className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                    <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-white text-xs truncate">{image.alt_description}</p>
                    <p className="text-gray-300 text-xs">by {image.user.name}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {images.length === 0 && !loading && (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Search for beautiful travel images to use in your trip
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>

          {/* Note about API key */}
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Note: To use real Unsplash images, configure your VITE_UNSPLASH_ACCESS_KEY in the environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsplashImagePicker;
