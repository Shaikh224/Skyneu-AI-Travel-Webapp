import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  Plane,
  Calendar,
  Tag,
  ChevronRight,
  Gauge,
  Users,
  Fuel,
  MapPin,
  Clock,
  X,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2
} from 'lucide-react'
import { getAirplaneGuide } from '../lib/queries'
import type { AirplaneGuide } from '../types/sanity'
import RichTextRenderer from './RichTextRenderer'

const AircraftDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [aircraft, setAircraft] = useState<AirplaneGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0)

  useEffect(() => {
    if (slug) {
      loadAircraft(slug)
    }
  }, [slug])

  const loadAircraft = async (slug: string) => {
    try {
      setLoading(true)
      const data = await getAirplaneGuide(slug)
      setAircraft(data)
    } catch (err) {
      setError('Failed to load aircraft information')
      console.error('Error loading aircraft:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index)
    setIsLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = 'unset'
  }

  const nextImage = () => {
    if (aircraft?.images) {
      setLightboxImageIndex((prev) => (prev + 1) % aircraft.images.length)
    }
  }

  const previousImage = () => {
    if (aircraft?.images) {
      setLightboxImageIndex((prev) => (prev - 1 + aircraft.images.length) % aircraft.images.length)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isLightboxOpen) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') previousImage()
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, aircraft])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading aircraft information...</p>
        </div>
      </div>
    )
  }

  if (error || !aircraft) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aircraft Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error || 'The requested aircraft could not be found.'}</p>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/aviation-education')}
              className="inline-flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back to Aircraft Library</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-4">
              <button className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-4 sm:mt-6">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 overflow-x-auto">
              <span>Aviation Education</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Aircraft Library</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-gray-900 dark:text-white truncate">{aircraft.category}</span>
            </nav>

            {/* Aircraft Header */}
            <header className="mb-6 sm:mb-8">
              <div className="mb-3 sm:mb-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white break-words mb-2">{aircraft.title}</h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400">{aircraft.manufacturer} {aircraft.model}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <span className="px-2 py-1 sm:px-3 sm:py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs sm:text-sm font-medium">
                  {aircraft.category}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Updated {formatDate(aircraft.publishedAt)}</span>
              </div>

              {aircraft.tags && aircraft.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aircraft.tags.map((tag: string, index: number) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-xs sm:text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Image Gallery */}
            {aircraft.images && aircraft.images.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <div 
                  className="relative h-48 sm:h-64 lg:h-96 rounded-2xl overflow-hidden mb-3 sm:mb-4 group cursor-pointer"
                  onClick={() => openLightbox(activeImageIndex)}
                >
                  <img
                    src={aircraft.images[activeImageIndex]?.asset?.url}
                    alt={aircraft.images[activeImageIndex]?.alt || aircraft.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white p-2 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  {aircraft.images[activeImageIndex]?.caption && (
                    <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 bg-black/75 backdrop-blur-sm text-white p-2 sm:p-3 rounded-lg">
                      <p className="text-xs sm:text-sm">{aircraft.images[activeImageIndex].caption}</p>
                    </div>
                  )}
                </div>
                
                {aircraft.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {aircraft.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          index === activeImageIndex 
                            ? 'border-indigo-500 ring-4 ring-indigo-200 dark:ring-indigo-900 scale-105' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:scale-105'
                        }`}
                      >
                        <img
                          src={image.asset.url}
                          alt={image.alt || `${aircraft.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">About the {aircraft.model}</h2>
              <div className="prose prose-sm sm:prose-lg max-w-none">
                {aircraft.description ? (
                  typeof aircraft.description === 'string' ? (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">{aircraft.description}</p>
                  ) : (
                    <RichTextRenderer content={aircraft.description} />
                  )
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">Detailed description will be rendered here based on your Sanity schema.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 sm:space-y-6">
              {/* Quick Facts */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Quick Facts</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Manufacturer</span>
                    <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.manufacturer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Model</span>
                    <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Category</span>
                    <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.category}</span>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              {aircraft.specifications && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Specifications</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {aircraft.specifications.maxPassengers && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Max Passengers</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.specifications.maxPassengers}</span>
                      </div>
                    )}
                    
                    {aircraft.specifications.range && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Range</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.specifications.range.toLocaleString()} miles</span>
                      </div>
                    )}
                    
                    {aircraft.specifications.cruiseSpeed && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Cruise Speed</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.specifications.cruiseSpeed} mph</span>
                      </div>
                    )}
                    
                    {aircraft.specifications.maxAltitude && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Max Altitude</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.specifications.maxAltitude.toLocaleString()} ft</span>
                      </div>
                    )}
                    
                    {aircraft.specifications.engines && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Engines</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.specifications.engines}</span>
                      </div>
                    )}
                    
                    {aircraft.specifications.engineType && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Engine Type</span>
                        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{aircraft.specifications.engineType}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {isLightboxOpen && aircraft?.images && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 md:top-6 md:right-6 z-50 bg-white/10 hover:bg-white/20 text-white p-2 md:p-3 rounded-full transition-all duration-200 hover:scale-110"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50 bg-black/50 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-full text-sm md:text-base font-medium">
            {lightboxImageIndex + 1} / {aircraft.images.length}
          </div>

          {/* Navigation Buttons */}
          {aircraft.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); previousImage(); }}
                className="absolute left-2 md:left-4 z-50 bg-white/10 hover:bg-white/20 text-white p-2 md:p-4 rounded-full transition-all duration-200 hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-2 md:right-4 z-50 bg-white/10 hover:bg-white/20 text-white p-2 md:p-4 rounded-full transition-all duration-200 hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </>
          )}

          {/* Main Image Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={aircraft.images[lightboxImageIndex]?.asset?.url}
              alt={aircraft.images[lightboxImageIndex]?.alt || aircraft.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fadeIn"
            />
            
            {/* Image Caption */}
            {aircraft.images[lightboxImageIndex]?.caption && (
              <div className="absolute bottom-4 md:bottom-8 left-4 right-4 md:left-8 md:right-8 bg-black/70 backdrop-blur-md text-white p-3 md:p-4 rounded-xl text-center">
                <p className="text-sm md:text-base">{aircraft.images[lightboxImageIndex].caption}</p>
              </div>
            )}
          </div>

          {/* Thumbnail Strip - Desktop Only */}
          {aircraft.images.length > 1 && (
            <div className="hidden md:block absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <div className="flex gap-2 bg-black/50 backdrop-blur-sm p-3 rounded-2xl max-w-screen-lg overflow-x-auto">
                {aircraft.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setLightboxImageIndex(index); }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === lightboxImageIndex
                        ? 'border-white scale-110'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img
                      src={image.asset.url}
                      alt={image.alt || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Swipe Indicator */}
          <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {aircraft.images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setLightboxImageIndex(index); }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === lightboxImageIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AircraftDetailPage
