import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  ExternalLink,
  Download,
  Star,
  User,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Video,
  Globe,
  Wrench,
  GraduationCap,
  Book,
  Headphones,
  Smartphone,
  Clock,
  ChevronRight,
  Award
} from 'lucide-react'
import { getResource } from '../lib/queries'
import ImageWithFallback from './ImageWithFallback'

interface Resource {
  _id: string
  title: string
  slug: {
    current: string
  }
  description: string
  type: 'article' | 'video' | 'pdf' | 'website' | 'tool' | 'course' | 'book' | 'podcast' | 'app'
  url?: string
  file?: {
    asset: {
      _id: string
      url: string
      originalFilename: string
      size: number
    }
  }
  thumbnail?: {
    asset: {
      _id: string
      url: string
    }
    alt?: string
  }
  image?: {
    asset: {
      _id: string
      url: string
    }
    alt?: string
  }
  featuredImage?: {
    asset: {
      _id: string
      url: string
    }
    alt?: string
  }
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all-levels'
  tags?: string[]
  author?: string
  cost: 'free' | 'paid' | 'freemium'
  rating?: number
  featured?: boolean
  publishedAt: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

const ResourceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      loadResource()
    }
  }, [slug])

  const loadResource = async () => {
    if (!slug) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await getResource(slug)
      if (data) {
        setResource(data)
      } else {
        setError('Resource not found')
      }
    } catch (err) {
      setError('Failed to load resource')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'article':
        return <FileText className="w-6 h-6" />
      case 'video':
        return <Video className="w-6 h-6" />
      case 'pdf':
        return <FileText className="w-6 h-6" />
      case 'website':
        return <Globe className="w-6 h-6" />
      case 'tool':
        return <Wrench className="w-6 h-6" />
      case 'course':
        return <GraduationCap className="w-6 h-6" />
      case 'book':
        return <Book className="w-6 h-6" />
      case 'podcast':
        return <Headphones className="w-6 h-6" />
      case 'app':
        return <Smartphone className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'article':
        return 'text-blue-600 bg-blue-100'
      case 'video':
        return 'text-red-600 bg-red-100'
      case 'pdf':
        return 'text-red-600 bg-red-100'
      case 'website':
        return 'text-green-600 bg-green-100'
      case 'tool':
        return 'text-purple-600 bg-purple-100'
      case 'course':
        return 'text-indigo-600 bg-indigo-100'
      case 'book':
        return 'text-orange-600 bg-orange-100'
      case 'podcast':
        return 'text-pink-600 bg-pink-100'
      case 'app':
        return 'text-cyan-600 bg-cyan-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'text-green-600 bg-green-100'
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100'
      case 'advanced':
        return 'text-red-600 bg-red-100'
      case 'all-levels':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getCostColor = (cost: string) => {
    switch (cost?.toLowerCase()) {
      case 'free':
        return 'text-green-600 bg-green-100'
      case 'paid':
        return 'text-red-600 bg-red-100'
      case 'freemium':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCategory = (category: string) => {
    return category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Resource'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const handleDownload = () => {
    if (resource?.file?.asset?.url) {
      const link = document.createElement('a')
      link.href = resource.file.asset.url
      link.download = resource.file.asset.originalFilename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleVisitUrl = () => {
    if (resource?.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading resource...</p>
        </div>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resource Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The resource you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/aviation-education')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Education
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 mt-4 sm:mt-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/aviation-education')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Aviation Education
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                  {getTypeIcon(resource.type)}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 break-words">{resource.title}</h1>
                {resource.featured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">{formatCategory(resource.category)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                  {resource.difficulty?.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCostColor(resource.cost)}`}>
                  {resource.cost?.toUpperCase()}
                </span>
                {resource.rating && (
                  <div className="flex items-center gap-1">
                    {renderStars(resource.rating)}
                    <span className="text-xs">({resource.rating}/5)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resource Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Thumbnail Image */}
          {(resource.thumbnail?.asset?.url || resource.image?.asset?.url || resource.featuredImage?.asset?.url) && (
            <div className="p-6 pb-0">
              <ImageWithFallback
                src={resource.thumbnail?.asset?.url || resource.image?.asset?.url || resource.featuredImage?.asset?.url}
                alt={resource.thumbnail?.alt || resource.image?.alt || resource.featuredImage?.alt || resource.title}
                className="w-full h-64 object-cover rounded-lg"
                fallbackText="Resource Image"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{resource.description}</p>
            </div>

            {/* Resource Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Author */}
                {resource.author && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Author/Publisher</p>
                      <p className="font-medium text-gray-900">{resource.author}</p>
                    </div>
                  </div>
                )}

                {/* Published Date */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Published</p>
                    <p className="font-medium text-gray-900">{formatDate(resource.publishedAt)}</p>
                  </div>
                </div>

                {/* File Information */}
                {resource.file?.asset && (
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">File</p>
                      <p className="font-medium text-gray-900">
                        {resource.file.asset.originalFilename}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(resource.file.asset.size)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Category */}
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium text-gray-900">{formatCategory(resource.category)}</p>
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${getTypeColor(resource.type)}`}>
                    {getTypeIcon(resource.type)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium text-gray-900 capitalize">{resource.type}</p>
                  </div>
                </div>

                {/* Cost */}
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Cost</p>
                    <p className="font-medium text-gray-900 capitalize">{resource.cost}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {resource.url && (
                <button
                  onClick={handleVisitUrl}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Visit Website
                </button>
              )}
              
              {resource.file?.asset && (
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </button>
              )}
            </div>

            {/* No Actions Available */}
            {!resource.url && !resource.file?.asset && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Actions Available</h3>
                <p className="text-gray-600">
                  This resource doesn't have a downloadable file or external URL.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResourceDetailPage
