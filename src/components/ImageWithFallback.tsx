import React, { useState } from 'react'
import { ImageIcon } from 'lucide-react'

interface ImageWithFallbackProps {
  src?: string
  alt?: string
  className?: string
  fallbackText?: string
  showFallback?: boolean
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = '',
  className = '',
  fallbackText = 'Image not available',
  showFallback = true
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  if (!src || imageError) {
    if (!showFallback) return null
    
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{fallbackText}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {!imageLoaded && (
        <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageLoaded ? 'block' : 'hidden'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  )
}

export default ImageWithFallback
