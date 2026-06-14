import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  MapPin, 
  Plane, 
  Clock, 
  Wifi, 
  Car, 
  Train, 
  Coffee, 
  ShoppingBag,
  Star,
  ExternalLink,
  Building,
  Users,
  CreditCard,
  ChevronRight
} from 'lucide-react'
import { getAirport } from '../lib/queries'
import type { Airport } from '../types/sanity'
import ImageWithFallback from './ImageWithFallback'
import RichTextRenderer from './RichTextRenderer'

const AirportDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [airport, setAirport] = useState<Airport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (code) {
      loadAirport()
    }
  }, [code])

  const loadAirport = async () => {
    if (!code) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await getAirport(code)
      
      if (data) {
        setAirport(data)
      } else {
        setError('Airport not found')
      }
    } catch (err) {
      console.error('Error loading airport:', err)
      setError('Failed to load airport information')
    } finally {
      setLoading(false)
    }
  }

  const getTransportIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'taxi':
      case 'rideshare':
        return <Car className="w-5 h-5" />
      case 'public-transit':
      case 'train':
        return <Train className="w-5 h-5" />
      case 'airport-shuttle':
        return <Plane className="w-5 h-5" />
      default:
        return <Car className="w-5 h-5" />
    }
  }

  const getAccessIcon = (access: string) => {
    switch (access.toLowerCase()) {
      case 'priority-pass':
        return <Star className="w-4 h-4 text-yellow-500" />
      case 'airline-status':
        return <Plane className="w-4 h-4 text-blue-500" />
      case 'credit-card':
        return <CreditCard className="w-4 h-4 text-green-500" />
      case 'paid-access':
        return <CreditCard className="w-4 h-4 text-gray-500" />
      case 'first-business':
        return <Star className="w-4 h-4 text-purple-500" />
      default:
        return <Star className="w-4 h-4 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'major-international':
        return 'bg-blue-100 text-blue-800'
      case 'regional':
        return 'bg-green-100 text-green-800'
      case 'domestic':
        return 'bg-yellow-100 text-yellow-800'
      case 'cargo-hub':
        return 'bg-purple-100 text-purple-800'
      case 'general-aviation':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading airport information...</p>
        </div>
      </div>
    )
  }

  if (error || !airport) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Airport Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The requested airport could not be found.'}</p>
          <button
            onClick={() => navigate('/aviation-education')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Aviation Education
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-8 mt-4 sm:mt-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/aviation-education')}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Aviation Education
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 break-words">
                {airport.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{airport.city}, {airport.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  <span className="font-mono text-base sm:text-lg font-semibold">{airport.code}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(airport.category)}`}>
                  {airport.category.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            
            {airport.featured && (
              <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-medium">
                <Star className="w-4 h-4" />
                Featured
              </div>
            )}
          </div>
        </div>

        {/* Main Image */}
        <div className="mb-6">
          <ImageWithFallback
            src={
              airport.images?.[0]?.asset?.url || 
              airport.image?.asset?.url ||
              airport.featuredImage?.asset?.url ||
              airport.mainImage?.asset?.url ||
              airport.photo?.asset?.url ||
              airport.photos?.[0]?.asset?.url ||
              airport.media?.asset?.url ||
              (airport.description && airport.description.find((block: any) => block._type === 'image')?.asset?.url)
            }
            alt={
              airport.images?.[0]?.alt || 
              airport.image?.alt || 
              airport.featuredImage?.alt ||
              airport.mainImage?.alt ||
              airport.photo?.alt ||
              airport.photos?.[0]?.alt ||
              airport.media?.alt ||
              airport.description?.find((block: any) => block._type === 'image')?.alt ||
              airport.name
            }
            className="w-full h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl shadow-lg object-cover"
            fallbackText="Airport Image"
          />
          {(airport.images?.[0]?.caption || airport.image?.caption || airport.featuredImage?.caption || airport.mainImage?.caption || airport.photo?.caption || airport.photos?.[0]?.caption || airport.media?.caption || airport.description?.find((block: any) => block._type === 'image')?.caption) && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
              {airport.images?.[0]?.caption || airport.image?.caption || airport.featuredImage?.caption || airport.mainImage?.caption || airport.photo?.caption || airport.photos?.[0]?.caption || airport.media?.caption || airport.description?.find((block: any) => block._type === 'image')?.caption}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">About {airport.name}</h2>
          {airport.description && airport.description.length > 0 ? (
            <div className="prose dark:prose-invert max-w-none">
              <RichTextRenderer content={airport.description} />
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6">
              <p className="text-blue-800 dark:text-blue-300 text-sm sm:text-base">
                {airport.name} ({airport.code}) is a {airport.category?.replace('-', ' ').toLowerCase()} airport 
                serving {airport.city}, {airport.country}. This airport provides various services and facilities 
                for travelers.
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Services & Amenities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Services & Amenities
            </h3>
            {airport.services && airport.services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {airport.services.map((service, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
                    <span className="text-sm">{service}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic text-sm">No services information available yet.</p>
            )}
          </div>

          {/* Transportation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-green-600 dark:text-green-400" />
              Transportation Options
            </h3>
            {airport.transportation && Array.isArray(airport.transportation) && airport.transportation.length > 0 ? (
              <div className="space-y-3">
                {airport.transportation.map((transport: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getTransportIcon(transport.type)}
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize text-sm sm:text-base">
                        {transport.type.replace('-', ' ')}
                      </h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{transport.description}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {transport.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{transport.duration}</span>
                        </div>
                      )}
                      {transport.estimatedCost && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          <span>{transport.estimatedCost}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic text-sm">No transportation information available yet.</p>
            )}
          </div>

          {/* Terminals */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Terminal Information
            </h3>
            {airport.terminals && Array.isArray(airport.terminals) && airport.terminals.length > 0 ? (
              <div className="space-y-3">
                {airport.terminals.map((terminal: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">{terminal.name}</h4>
                    {terminal.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{terminal.description}</p>
                    )}
                    {terminal.airlines && terminal.airlines.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Airlines:</p>
                        <div className="flex flex-wrap gap-2">
                          {terminal.airlines.map((airline: string, airlineIndex: number) => (
                            <span
                              key={airlineIndex}
                              className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs"
                            >
                              {airline}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic text-sm">No terminal information available yet.</p>
            )}
          </div>

          {/* Lounges */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Airport Lounges
            </h3>
            {airport.lounges && Array.isArray(airport.lounges) && airport.lounges.length > 0 ? (
              <div className="space-y-3">
                {airport.lounges.map((lounge: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{lounge.name}</h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {getAccessIcon(lounge.access)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize hidden sm:inline">
                          {lounge.access.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    {lounge.location && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {lounge.location}
                      </p>
                    )}
                    {lounge.amenities && lounge.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {lounge.amenities.map((amenity: string, amenityIndex: number) => (
                          <span
                            key={amenityIndex}
                            className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic text-sm">No lounge information available yet.</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {airport.tags && airport.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {airport.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-200 dark:border-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Images */}
        {((airport.images && airport.images.length > 1) || (airport.image && airport.images && airport.images.length > 0)) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">More Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {airport.images && airport.images.length > 1 ? (
                airport.images.slice(1).map((image, index) => (
                  <div key={index} className="relative group">
                    <ImageWithFallback
                      src={image.asset?.url}
                      alt={image.alt || `${airport.name} - Image ${index + 2}`}
                      className="w-full h-28 sm:h-32 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow"
                      fallbackText="Airport Image"
                    />
                    {image.caption && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))
              ) : airport.image && (
                <div className="relative group">
                  <ImageWithFallback
                    src={airport.image.asset?.url}
                    alt={airport.image.alt || `${airport.name} - Image`}
                    className="w-full h-28 sm:h-32 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow"
                    fallbackText="Airport Image"
                  />
                  {airport.image.caption && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {airport.image.caption}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default AirportDetailPage
