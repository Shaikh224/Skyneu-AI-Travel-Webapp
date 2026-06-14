import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
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
  Phone,
  Mail,
  Globe,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { getTravelAdvisory } from '../lib/queries'
import RichTextRenderer from './RichTextRenderer'

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

const TravelAdvisoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  
  const [advisory, setAdvisory] = useState<TravelAdvisory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    recommendations: true,
    emergencyContacts: true,
    affectedRegions: false
  })

  useEffect(() => {
    if (slug) {
      loadAdvisory()
    }
  }, [slug])

  const loadAdvisory = async () => {
    if (!slug) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await getTravelAdvisory(slug)
      if (data) {
        setAdvisory(data)
      } else {
        setError('Travel advisory not found')
      }
    } catch (err) {
      setError('Failed to load travel advisory')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'safety':
        return <Shield className="w-6 h-6" />
      case 'health':
        return <Heart className="w-6 h-6" />
      case 'regulation':
        return <FileText className="w-6 h-6" />
      case 'tips':
        return <Zap className="w-6 h-6" />
      case 'security':
        return <Shield className="w-6 h-6" />
      case 'weather':
        return <Cloud className="w-6 h-6" />
      case 'political':
        return <Users className="w-6 h-6" />
      case 'natural-disaster':
        return <AlertTriangle className="w-6 h-6" />
      default:
        return <AlertTriangle className="w-6 h-6" />
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

  const getRecommendationColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'avoid-travel':
        return 'text-red-600 bg-red-100'
      case 'exercise-caution':
        return 'text-yellow-600 bg-yellow-100'
      case 'normal-precautions':
        return 'text-green-600 bg-green-100'
      case 'enhanced-security':
        return 'text-blue-600 bg-blue-100'
      case 'monitor-situation':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCategory = (category: string) => {
    return category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Advisory'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading travel advisory...</p>
        </div>
      </div>
    )
  }

  if (error || !advisory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Advisory Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The travel advisory you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/aviation-education')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Education
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 mt-4 sm:mt-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <button
                onClick={() => navigate('/aviation-education')}
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Aviation Education
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-2" />
              <button
                onClick={() => navigate('/aviation-education?tab=advisories')}
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Travel Advisories
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
                {advisory.title}
              </span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/aviation-education')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Education
            </button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Travel Advisory</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${getCategoryColor(advisory.category)}`}>
                  {getCategoryIcon(advisory.category)}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white break-words">{advisory.title}</h1>
                {advisory.featured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{advisory.country}</span>
                </div>
                <span className="font-medium">{formatCategory(advisory.category)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(advisory.severity)}`}>
                  {advisory.severity?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
          isExpired(advisory.expiryDate) ? 'bg-red-50 border-red-400' :
          !isActive(advisory.effectiveDate, advisory.expiryDate) ? 'bg-yellow-50 border-yellow-400' :
          'bg-green-50 border-green-400'
        }`}>
          <div className="flex items-center gap-2">
            {isExpired(advisory.expiryDate) ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : !isActive(advisory.effectiveDate, advisory.expiryDate) ? (
              <Clock className="w-5 h-5 text-yellow-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <span className={`font-medium ${
              isExpired(advisory.expiryDate) ? 'text-red-800' :
              !isActive(advisory.effectiveDate, advisory.expiryDate) ? 'text-yellow-800' :
              'text-green-800'
            }`}>
              {isExpired(advisory.expiryDate) ? 'This advisory has expired' :
               !isActive(advisory.effectiveDate, advisory.expiryDate) ? 'This advisory is not yet active' :
               'This advisory is currently active'}
            </span>
          </div>
        </div>

        {/* Advisory Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Content */}
          <div className="p-6">
            {/* Rich Text Content */}
            {advisory.content && advisory.content.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Advisory Details</h2>
                <div className="prose prose-gray max-w-none">
                  <RichTextRenderer content={advisory.content} />
                </div>
              </div>
            )}

            {/* Key Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Effective Date */}
                {advisory.effectiveDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Effective Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(advisory.effectiveDate)}</p>
                    </div>
                  </div>
                )}

                {/* Expiry Date */}
                {advisory.expiryDate && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expiry Date</p>
                      <p className={`font-medium ${isExpired(advisory.expiryDate) ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {formatDate(advisory.expiryDate)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Source */}
                {advisory.source && (
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Source</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">{advisory.source}</p>
                        {advisory.sourceUrl && (
                          <a
                            href={advisory.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Category */}
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${getCategoryColor(advisory.category)}`}>
                    {getCategoryIcon(advisory.category)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCategory(advisory.category)}</p>
                  </div>
                </div>

                {/* Severity */}
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Severity Level</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{advisory.severity}</p>
                  </div>
                </div>

                {/* Published Date */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(advisory.publishedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Affected Regions */}
            {advisory.affectedRegions && advisory.affectedRegions.length > 0 && (
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('affectedRegions')}
                  className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Affected Regions</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                      {advisory.affectedRegions.length}
                    </span>
                  </div>
                  {expandedSections.affectedRegions ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                {expandedSections.affectedRegions && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-2">
                      {advisory.affectedRegions.map((region, index) => (
                        <div key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>{region}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Travel Recommendations */}
            {advisory.recommendations && advisory.recommendations.length > 0 && (
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('recommendations')}
                  className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Travel Recommendations</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                      {advisory.recommendations.length}
                    </span>
                  </div>
                  {expandedSections.recommendations ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                {expandedSections.recommendations && (
                  <div className="mt-4 space-y-4">
                    {advisory.recommendations.map((recommendation, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(recommendation.action)}`}>
                            {recommendation.action?.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-700">{recommendation.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Emergency Contacts */}
            {advisory.emergencyContacts && advisory.emergencyContacts.length > 0 && (
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('emergencyContacts')}
                  className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Emergency Contacts</h3>
                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                      {advisory.emergencyContacts.length}
                    </span>
                  </div>
                  {expandedSections.emergencyContacts ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                {expandedSections.emergencyContacts && (
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {advisory.emergencyContacts.map((contact, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">{contact.name}</h4>
                        <div className="space-y-2">
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.website && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Globe className="w-4 h-4" />
                              <a
                                href={contact.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-600"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {advisory.tags && advisory.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {advisory.tags.map((tag, index) => (
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default TravelAdvisoryDetailPage
