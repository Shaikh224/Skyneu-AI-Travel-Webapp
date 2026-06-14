import React from 'react'
import { 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Star,
  Shield,
  Heart,
  FileText,
  Zap,
  Cloud,
  Users,
  Globe,
  ChevronRight,
  Phone,
  Mail,
  Globe as GlobeIcon
} from 'lucide-react'
import ImageWithFallback from './ImageWithFallback'

interface TravelAdvisory {
  _id: string
  title: string
  slug: {
    current: string
  }
  country: string
  content?: any[]
  category: 'safety' | 'health' | 'regulation' | 'tips' | 'security' | 'weather' | 'political' | 'natural-disaster'
  severity: 'low' | 'moderate' | 'high' | 'critical'
  effectiveDate?: string
  expiryDate?: string
  source?: string
  sourceUrl?: string
  affectedRegions?: string[]
  recommendations?: Array<{
    action: string
    description: string
  }>
  emergencyContacts?: Array<{
    name: string
    phone?: string
    email?: string
    website?: string
  }>
  tags?: string[]
  publishedAt: string
  featured?: boolean
}

interface TravelAdvisoryCardProps {
  advisory: TravelAdvisory
  onClick: () => void
}

const TravelAdvisoryCard: React.FC<TravelAdvisoryCardProps> = ({ advisory, onClick }) => {
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'safety':
        return <Shield className="w-4 h-4" />
      case 'health':
        return <Heart className="w-4 h-4" />
      case 'regulation':
        return <FileText className="w-4 h-4" />
      case 'tips':
        return <Zap className="w-4 h-4" />
      case 'security':
        return <Shield className="w-4 h-4" />
      case 'weather':
        return <Cloud className="w-4 h-4" />
      case 'political':
        return <Users className="w-4 h-4" />
      case 'natural-disaster':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'safety':
        return 'text-blue-600 bg-blue-100'
      case 'health':
        return 'text-green-600 bg-green-100'
      case 'regulation':
        return 'text-purple-600 bg-purple-100'
      case 'tips':
        return 'text-yellow-600 bg-yellow-100'
      case 'security':
        return 'text-red-600 bg-red-100'
      case 'weather':
        return 'text-cyan-600 bg-cyan-100'
      case 'political':
        return 'text-orange-600 bg-orange-100'
      case 'natural-disaster':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCategory = (category: string) => {
    return category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Advisory'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  const isActive = (effectiveDate?: string, expiryDate?: string) => {
    const now = new Date()
    if (effectiveDate && new Date(effectiveDate) > now) return false
    if (expiryDate && new Date(expiryDate) < now) return false
    return true
  }

  const getMainRecommendation = () => {
    if (!advisory.recommendations || advisory.recommendations.length === 0) return null
    return advisory.recommendations[0]
  }

  const mainRecommendation = getMainRecommendation()

  return (
    <article 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-red-200 dark:hover:border-red-400 transition-all duration-300 cursor-pointer group overflow-hidden h-full flex flex-col"
    >
      {/* Header Section with Gradient Background */}
      <div className="relative p-6 pb-4">
        {/* Top Row - Severity and Status */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex flex-col gap-2">
            {/* Severity Badge */}
            <span className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide ${getSeverityColor(advisory.severity)} w-fit`}>
              {advisory.severity?.toUpperCase()}
            </span>
            
            {/* Category Badge */}
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 w-fit ${getCategoryColor(advisory.category)}`}>
              {getCategoryIcon(advisory.category)}
              {formatCategory(advisory.category)}
            </span>
          </div>
          
          {/* Status Indicator */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              {isExpired(advisory.expiryDate) ? (
                <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-full">Expired</span>
              ) : !isActive(advisory.effectiveDate, advisory.expiryDate) ? (
                <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 px-2 py-1 rounded-full">Pending</span>
              ) : (
                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">Active</span>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-red-600 transition-colors mt-1" />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
          {advisory.title}
        </h3>

        {/* Country and Regions */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">{advisory.country}</span>
          </div>
          {advisory.affectedRegions && advisory.affectedRegions.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {advisory.affectedRegions.length} region{advisory.affectedRegions.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 pb-4 flex-1 flex flex-col">
        {/* Main Recommendation */}
        {mainRecommendation && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recommendation</span>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold inline-block ${
              mainRecommendation.action === 'avoid-travel' ? 'text-red-700 bg-red-100 border border-red-200' :
              mainRecommendation.action === 'exercise-caution' ? 'text-yellow-700 bg-yellow-100 border border-yellow-200' :
              mainRecommendation.action === 'normal-precautions' ? 'text-green-700 bg-green-100 border border-green-200' :
              'text-blue-700 bg-blue-100 border border-blue-200'
            }`}>
              {mainRecommendation.action?.replace('-', ' ').toUpperCase()}
            </span>
          </div>
        )}

        {/* Spacer to push bottom content down */}
        <div className="flex-1"></div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          {/* Date and Source Row */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDate(advisory.publishedAt)}</span>
            </div>
            {advisory.source && (
              <div className="flex items-center gap-2">
                <span className="truncate max-w-28 text-xs bg-gray-50 px-2 py-1 rounded-full">{advisory.source}</span>
                {advisory.sourceUrl && <ExternalLink className="w-3 h-3" />}
              </div>
            )}
          </div>

          {/* Emergency Contacts Indicator */}
          {advisory.emergencyContacts && advisory.emergencyContacts.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Phone className="w-3 h-3" />
              <span>{advisory.emergencyContacts.length} emergency contact{advisory.emergencyContacts.length > 1 ? 's' : ''} available</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default TravelAdvisoryCard
