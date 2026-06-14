import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getTravelGuide } from '../lib/queries'
import type { TravelGuide } from '../types/sanity'
import RichTextRenderer from './RichTextRenderer'

const TravelGuideDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [guide, setGuide] = useState<TravelGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    if (slug) {
      loadGuide(slug)
    }
  }, [slug])

  const loadGuide = async (slug: string) => {
    try {
      setLoading(true)
      const data = await getTravelGuide(slug)
      setGuide(data)
    } catch (err) {
      setError('Failed to load travel guide')
      console.error('Error loading travel guide:', err)
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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading travel guide...</p>
        </div>
      </div>
    )
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Travel Guide Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The requested travel guide could not be found.'}</p>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/aviation-education')}
          className="mb-4 inline-flex items-center gap-2 text-skyneu-blue hover:text-skyneu-blue/80 dark:text-skyneu-green dark:hover:text-skyneu-green/80 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Travel Guides
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
              <span>Aviation Education</span>
              <span className="opacity-60">/</span>
              <span>Travel Guides</span>
              <span className="opacity-60">/</span>
              <span className="text-gray-900 dark:text-white truncate">{guide.country}</span>
            </nav>

            {/* Guide Header */}
            <header className="mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight break-words mb-2">
                {guide.title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                {guide.city}, {guide.country}
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                {guide.category && (
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium">
                    {guide.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
                {guide.difficulty && (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium">
                    {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                  </span>
                )}
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Updated {formatDate(guide.publishedAt)}
                </div>
              </div>

            </header>

            {/* Image Gallery */}
            {guide.images && guide.images.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Gallery
                </h2>
                
                <div className="relative h-56 sm:h-72 md:h-96 rounded-2xl overflow-hidden mb-3 sm:mb-4">
                  <img
                    src={guide.images[activeImageIndex]?.asset?.url}
                    alt={guide.images[activeImageIndex]?.alt || guide.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {guide.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {guide.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          index === activeImageIndex 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.asset.url}
                          alt={image.alt || `${guide.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            {guide.content && (
              <div className="mb-8">
                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
                  {typeof guide.content === 'string' ? (
                    <div className="text-gray-700 dark:text-gray-200 leading-relaxed space-y-4">
                      {(guide.content as string).split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <RichTextRenderer content={guide.content} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Quick Info */}
              <div className="rounded-xl p-5 sm:p-6 bg-gradient-to-br from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Destination Info
                </h3>
                <dl className="divide-y divide-gray-200 dark:divide-dark-border text-sm">
                  <div className="py-2 sm:py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-gray-600 dark:text-gray-400">City</dt>
                    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900 dark:text-white font-medium">{guide.city}</dd>
                  </div>

                  <div className="py-2 sm:py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-gray-600 dark:text-gray-400">Country</dt>
                    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900 dark:text-white font-medium">{guide.country}</dd>
                  </div>

                  {guide.category && (
                    <div className="py-2 sm:py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-gray-600 dark:text-gray-400">Category</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900 dark:text-white font-medium">
                        {guide.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </dd>
                    </div>
                  )}

                  {guide.difficulty && (
                    <div className="py-2 sm:py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-gray-600 dark:text-gray-400">Difficulty</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900 dark:text-white font-medium">
                        {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                      </dd>
                    </div>
                  )}

                  {guide.bestTimeToVisit && (
                    <div className="py-2 sm:py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-gray-600 dark:text-gray-400">Best Time</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900 dark:text-white font-medium whitespace-pre-line">{guide.bestTimeToVisit}</dd>
                    </div>
                  )}

                  {guide.estimatedCost && (
                    <div className="py-2 sm:py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-gray-600 dark:text-gray-400">Daily Cost</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-900 dark:text-white font-medium whitespace-pre-line">{guide.estimatedCost}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Travel Tips */}
              {guide.tips && guide.tips.length > 0 && (
                <div className="rounded-xl p-5 sm:p-6 bg-gradient-to-br from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Travel Tips
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm marker:text-skyneu-blue dark:marker:text-skyneu-green">
                    {guide.tips.map((tip, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-200">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions removed per design cleanup request */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TravelGuideDetailPage
