import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Clock, 
  Calendar, 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  Eye,
  Tag,
  ChevronRight
} from 'lucide-react'
import { getAviationGuide } from '../lib/queries'
import type { Guide } from '../types/sanity'
import RichTextRenderer from './RichTextRenderer'

const GuideDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      loadGuide(slug)
    }
  }, [slug])

  const loadGuide = async (slug: string) => {
    try {
      setLoading(true)
      const data = await getAviationGuide(slug)
      console.log('Guide data:', data) // Debug log
      console.log('Guide content:', data?.content) // Debug log
      setGuide(data)
    } catch (err) {
      setError('Failed to load guide')
      console.error('Error loading guide:', err)
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'intermediate':
      case 'medium':
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100'
      case 'advanced':
      case 'hard':
      case 'challenging':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading guide...</p>
        </div>
      </div>
    )
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Guide Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The requested guide could not be found.'}</p>
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
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/aviation-education')}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Guides
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4 sm:mt-6">
        {/* Hero Image */}
        {guide.featuredImage && (
          <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
            <img
              src={guide.featuredImage.asset.url}
              alt={guide.featuredImage.alt || guide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>Aviation Education</span>
            <ChevronRight className="w-4 h-4" />
            <span>Guides</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white">{guide.category}</span>
          </nav>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight break-words">
            {guide.title}
          </h1>

          {/* Excerpt */}
          {guide.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              {guide.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 mb-6">
            
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(guide.publishedAt)}</span>
            </div>
            
            {guide.readingTime && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{guide.readingTime} min read</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Eye className="w-4 h-4" />
              <span>1.2k views</span>
            </div>
          </div>

          {/* Tags and Difficulty */}
          <div className="flex flex-wrap items-center gap-4">
            {guide.difficulty && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(guide.difficulty)}`}>
                {guide.difficulty}
              </span>
            )}
            
            {guide.tags && guide.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {guide.tags.map((tag: string, index: number) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {guide.content && guide.content.length > 0 ? (
            <RichTextRenderer content={guide.content} />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800">
                Content is being prepared. Please check back soon!
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Share2 className="w-4 h-4" />
                Share Article
              </button>
              <button className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Bookmark className="w-4 h-4" />
                Save for Later
              </button>
            </div>
            
            {guide.seo?.metaTitle && (
              <div className="text-sm text-gray-500">
                SEO: {guide.seo.metaTitle}
              </div>
            )}
          </div>
        </footer>
      </article>
    </div>
  )
}

export default GuideDetailPage
