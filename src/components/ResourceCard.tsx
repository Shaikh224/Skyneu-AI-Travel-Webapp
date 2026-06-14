import React from 'react'
import { 
  ExternalLink, 
  Download, 
  Star, 
  Clock, 
  User, 
  DollarSign, 
  FileText,
  Video,
  Globe,
  Wrench,
  GraduationCap,
  Book,
  Headphones,
  Smartphone,
  ChevronRight
} from 'lucide-react'
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
}

interface ResourceCardProps {
  resource: Resource
  onClick: () => void
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onClick }) => {
  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'article':
        return <FileText className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'website':
        return <Globe className="w-4 h-4" />
      case 'tool':
        return <Wrench className="w-4 h-4" />
      case 'course':
        return <GraduationCap className="w-4 h-4" />
      case 'book':
        return <Book className="w-4 h-4" />
      case 'podcast':
        return <Headphones className="w-4 h-4" />
      case 'app':
        return <Smartphone className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <article 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {(resource.thumbnail?.asset?.url || resource.image?.asset?.url || resource.featuredImage?.asset?.url) ? (
          <ImageWithFallback
            src={resource.thumbnail?.asset?.url || resource.image?.asset?.url || resource.featuredImage?.asset?.url}
            alt={resource.thumbnail?.alt || resource.image?.alt || resource.featuredImage?.alt || resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackText="Resource Image"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${getTypeColor(resource.type)}`}>
                {getTypeIcon(resource.type)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium capitalize">{resource.type}</p>
            </div>
          </div>
        )}
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTypeColor(resource.type)}`}>
            {getTypeIcon(resource.type)}
            {resource.type?.toUpperCase()}
          </span>
        </div>
        
        {/* Featured Badge */}
        {resource.featured && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
              <Star className="w-3 h-3" />
              Featured
            </span>
          </div>
        )}
        
        {/* Cost Badge */}
        <div className="absolute bottom-4 right-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCostColor(resource.cost)}`}>
            <DollarSign className="w-3 h-3" />
            {resource.cost?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Title */}
        <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {resource.description}
        </p>

        {/* Meta Information */}
        <div className="space-y-2 mb-4">
          {/* Category and Difficulty */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatCategory(resource.category)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
              {resource.difficulty?.toUpperCase()}
            </span>
          </div>

          {/* Author */}
          {resource.author && (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{resource.author}</span>
            </div>
          )}

          {/* Rating */}
          {resource.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(resource.rating)}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">({resource.rating}/5)</span>
            </div>
          )}

          {/* File Info */}
          {resource.file?.asset && (
            <div className="flex items-center gap-2">
              <Download className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {resource.file.asset.originalFilename} ({formatFileSize(resource.file.asset.size)})
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {resource.url && (
              <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Visit
              </span>
            )}
            {resource.file?.asset && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <Download className="w-3 h-3" />
                Download
              </span>
            )}
            {!resource.url && !resource.file?.asset && (
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">View Details</span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>
    </article>
  )
}

export default ResourceCard
