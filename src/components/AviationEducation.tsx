import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  Plane, 
  MapPin, 
  Star, 
  Search, 
  TrendingUp, 
  Globe, 
  Shield, 
  Newspaper, 
  Award, 
  ChevronRight, 
  ExternalLink,
  Clock,
  Calendar,
  ArrowRight,
  XCircle,
  Cloud,
  Users,
  Gauge
} from 'lucide-react'
import { getFeaturedContent, searchContent, getContentByTab, getQuizzes, getResources, getTravelAdvisories } from '../lib/queries'
import ImageWithFallback from './ImageWithFallback'
import QuizCard from './QuizCard'
import ResourceCard from './ResourceCard'
import TravelAdvisoryCard from './TravelAdvisoryCard'
import type { 
  AirplaneGuide, 
  NewsArticle
} from '../types/sanity'

interface TabConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const tabs: TabConfig[] = [
  { id: 'featured', label: 'Featured Content', icon: Star, description: 'Curated aviation content including top guides, news & aircraft' },
  { id: 'guides', label: 'Aviation Guides', icon: BookOpen, description: 'Comprehensive guides from fundamentals to advanced topics' },
  { id: 'airplanes', label: 'Aircraft Database', icon: Plane, description: 'Complete aircraft specifications & performance data' },
  { id: 'travel', label: 'Destination Guides', icon: MapPin, description: 'Expert travel insights for aviation enthusiasts' },
  { id: 'airports', label: 'Airport Directory', icon: Globe, description: 'Worldwide airport information & terminal guides' },
  { id: 'quizzes', label: 'Aviation Quizzes', icon: Award, description: 'Test and expand your aviation knowledge' },
  { id: 'resources', label: 'Learning Resources', icon: ExternalLink, description: 'Tools, calculators & reference materials' },
  { id: 'advisories', label: 'Safety Advisories', icon: Shield, description: 'Real-time travel safety & health alerts' },
  { id: 'news', label: 'Industry News', icon: Newspaper, description: 'Daily aviation news & breaking updates' }
]

const AviationEducation: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('featured')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [featuredContent, setFeaturedContent] = useState<any>(null)
  const [tabContent, setTabContent] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [searchFilters, setSearchFilters] = useState({
    type: 'all',
    category: 'all',
    dateRange: 'all'
  })

  // Load featured content on mount
  useEffect(() => {
    loadFeaturedContent()
  }, [])

  // Load content based on active tab
  useEffect(() => {
    if (activeTab !== 'featured' && !searchQuery) {
      loadTabContent(activeTab)
    }
  }, [activeTab])

  const loadFeaturedContent = async () => {
    setLoading(true)
    try {
      const content = await getFeaturedContent()
      setFeaturedContent(content)
    } catch (error) {
      console.error('Error loading featured content:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTabContent = async (tab: string) => {
    setLoading(true)
    try {
      let content = []
      if (tab === 'quizzes') {
        content = await getQuizzes()
      } else if (tab === 'resources') {
        content = await getResources()
      } else if (tab === 'advisories') {
        content = await getTravelAdvisories()
      } else {
        content = await getContentByTab(tab)
      }
      setTabContent(content || [])
    } catch (error) {
      console.error(`Error loading ${tab} content:`, error)
      setTabContent([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() && searchQuery.length >= 2) {
        performSearch(searchQuery)
      } else if (searchQuery.trim() === '') {
        setSearchResults(null)
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      generateSuggestions(searchQuery)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  const generateSuggestions = (query: string) => {
    const suggestions: string[] = []
    
    // Add common aviation terms
    const aviationTerms = [
      'flight training', 'aircraft systems', 'weather', 'navigation',
      'air traffic control', 'aviation safety', 'pilot license',
      'airport security', 'flight planning', 'emergency procedures'
    ]
    
    // Filter terms that match the query
    const matchingTerms = aviationTerms.filter(term => 
      term.toLowerCase().includes(query.toLowerCase())
    )
    suggestions.push(...matchingTerms)
    
    // Add content-based suggestions from current tab
    if (tabContent.length > 0) {
      tabContent.forEach(item => {
        if (item.title?.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push(item.title)
        }
        if (item.country?.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push(item.country)
        }
        if (item.category?.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push(item.category)
        }
      })
    }
    
    // Filter and limit suggestions
    const filteredSuggestions = [...new Set(suggestions)]
      .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
    
    setSearchSuggestions(filteredSuggestions)
    setShowSuggestions(filteredSuggestions.length > 0)
  }

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }
    
    setIsSearching(true)
    setLoading(true)
    
    try {
      const results = await searchContent(query)
      setSearchResults(results)
      
      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error('Error searching content:', error)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    await performSearch(searchQuery)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const handleHistoryClick = (historyItem: string) => {
    setSearchQuery(historyItem)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setSearchSuggestions([])
    setShowSuggestions(false)
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper function to safely render text content from Sanity
  const renderTextContent = (content: any): string => {
    if (!content) return ''
    
    // If it's already a string, return it
    if (typeof content === 'string') return content
    
    // If it's an array (Portable Text), extract text from blocks
    if (Array.isArray(content)) {
      return content
        .filter(block => block._type === 'block' && block.children)
        .map(block => 
          block.children
            .filter((child: any) => child._type === 'span')
            .map((child: any) => child.text)
            .join('')
        )
        .join(' ')
        .trim()
    }
    
    // If it's an object with text property
    if (content.text) return content.text
    
    // Fallback to string conversion
    return String(content)
  }

  const handleCardClick = (type: string, item: any) => {
    const slug = item.slug?.current || item.code || item._id
    
    switch (type) {
      case 'guides':
      case 'articles':
        navigate(`/aviation-education/guides/${slug}`)
        break
      case 'airplanes':
      case 'aircraft':
        navigate(`/aviation-education/aircraft/${slug}`)
        break
      case 'travel':
      case 'travelGuides':
        navigate(`/aviation-education/travel/${slug}`)
        break
      case 'airports':
        navigate(`/aviation-education/airports/${item.code}`)
        break
      case 'news':
      case 'newsArticles':
        if (item.slug?.current) {
          navigate(`/aviation-education/news/${item.slug.current}`)
        } else {
          navigate(`/aviation-education/news/${item._id}`)
        }
        break
      case 'quizzes':
        navigate(`/aviation-education/quiz/${item._id}`)
        break
      case 'resources':
        navigate(`/aviation-education/resource/${item.slug?.current || item._id}`)
        break
      case 'advisories':
        navigate(`/aviation-education/advisory/${item.slug?.current || item._id}`)
        break
      default:
        // For other content types, you can add more cases or implement generic handling
        console.log(`Navigation for ${type} not implemented yet`)
    }
  }

  const renderFeaturedContent = () => (
    <div className="space-y-12">

      {/* Featured Guides */}
      {featuredContent?.guides?.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Essential Aviation Guides</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Expert-curated guides covering fundamentals to advanced topics</p>
            </div>
            <button onClick={() => setActiveTab('guides')} className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {featuredContent.guides.map((guide: any) => (
              <article 
                key={guide._id}
                onClick={() => handleCardClick('guides', guide)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
              >
                {guide.featuredImage && typeof guide.featuredImage === 'object' && 'asset' in guide.featuredImage && (guide.featuredImage as any).asset && (
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={(guide.featuredImage as any).asset.url} 
                      alt={(guide.featuredImage as any).alt || guide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(guide.category)}`}>
                        {guide.category}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{guide.readingTime || 5} min read</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(guide.publishedAt)}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                    {guide.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                    {guide.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Featured Aircraft */}
      {featuredContent?.airplaneGuides?.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Plane className="w-8 h-8 text-indigo-600" />
                Complete Aircraft Library
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Detailed specifications, performance data & technical insights</p>
            </div>
            <button onClick={() => setActiveTab('airplanes')} className="text-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-500 font-medium flex items-center gap-2 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
            {featuredContent.airplaneGuides.map((aircraft: AirplaneGuide) => (
              <article 
                key={aircraft._id}
                onClick={() => handleCardClick('aircraft', aircraft)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden"
              >
                {aircraft.images?.[0] && typeof aircraft.images[0] === 'object' && 'asset' in aircraft.images[0] && aircraft.images[0].asset && (
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                    <img 
                      src={(aircraft.images[0] as any).asset.url} 
                      alt={(aircraft.images[0] as any).alt || aircraft.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold shadow-lg">
                        {aircraft.category}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{aircraft.manufacturer}</span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">{formatDate(aircraft.publishedAt)}</span>
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                    {aircraft.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 font-medium">
                    {aircraft.manufacturer} {aircraft.model}
                  </p>
                  
                  {/* Specifications Preview */}
                  {aircraft.specifications && (
                    <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                      {aircraft.specifications.maxPassengers && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {aircraft.specifications.maxPassengers} passengers
                          </span>
                        </div>
                      )}
                      {aircraft.specifications.range && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {aircraft.specifications.range.toLocaleString()} mi
                          </span>
                        </div>
                      )}
                      {aircraft.specifications.cruiseSpeed && (
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {aircraft.specifications.cruiseSpeed} mph
                          </span>
                        </div>
                      )}
                      {aircraft.specifications.maxAltitude && (
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {aircraft.specifications.maxAltitude.toLocaleString()} ft
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">View Details</span>
                    <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Featured News */}
      {(() => {
        const articles = (featuredContent?.newsArticles || []) as NewsArticle[];
        // Show latest 3 news articles (already filtered by featured in query, or all if none featured)
        const displayNews = articles.slice(0, 3);
        return displayNews.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Breaking Aviation News & Updates</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Real-time industry news, airline updates & aviation trends</p>
            </div>
            <button onClick={() => setActiveTab('news')} className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {displayNews.map((news: NewsArticle) => (
              <article 
                key={news._id}
                onClick={() => handleCardClick('news', news)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={news.image && news.image !== null && typeof news.image === 'object' && 'asset' in news.image ? (news.image as any).asset?.url : undefined}
                    alt={news.image && news.image !== null && typeof news.image === 'object' && 'alt' in news.image ? (news.image as any).alt || news.title : news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallbackText="News Image"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                      News
                    </span>
                    {(news as any).breaking && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium animate-pulse">
                        Breaking
                      </span>
                    )}
                    {news.featured && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                  {news.image && news.image !== null && typeof news.image === 'object' && 'caption' in news.image && (news.image as any).caption && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-sm bg-black/50 rounded-lg p-2 line-clamp-2">
                        {(news.image as any).caption}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                    {news.source && <span>{news.source}</span>}
                    {news.author && news.source && <span className="text-gray-300 dark:text-gray-600">•</span>}
                    {news.author && <span>{news.author}</span>}
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span>{formatDate(news.publishedAt)}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2 break-words">
                    {news.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                    {news.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Read Article</span>
                      {(news as any).breaking && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                          Breaking
                        </span>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        ) : null;
      })()}

      {/* Featured Travel Advisories */}
      {featuredContent?.travelAdvisories?.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Global Travel Safety Alerts</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Live safety updates, health advisories & travel restrictions</p>
            </div>
            <button onClick={() => setActiveTab('advisories')} className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {featuredContent.travelAdvisories.map((advisory: any) => (
              <TravelAdvisoryCard
                key={advisory._id}
                advisory={advisory}
                onClick={() => handleCardClick('advisories', advisory)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )

  const renderTabContent = () => {
    if (searchResults) {
      return renderSearchResults()
    }
    
    if (activeTab === 'featured') {
      return renderFeaturedContent()
    }

    if (tabContent.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon || BookOpen, { 
              className: "w-10 h-10 text-gray-400" 
            })}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
          <p className="text-gray-500">No content available yet. Check back soon!</p>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500 dark:text-gray-400 block">{tabContent.length} items</span>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">{tabContent.map((item: any) => {
            // Check for images in multiple places
            const image = item.images?.[0] || 
                         item.image || 
                         item.featuredImage ||
                         item.mainImage ||
                         item.photo ||
                         item.photos?.[0] ||
                         item.media ||
                         (item.description && Array.isArray(item.description) && item.description.find((block: any) => block._type === 'image'))
            const imageUrl = image?.asset?.url
            const imageAlt = image?.alt || item.title || item.name
            
            
            // Special handling for airport cards
            if (activeTab === 'airports') {
              return (
                <article 
                  key={item._id}
                  onClick={() => handleCardClick(activeTab, item)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <ImageWithFallback
                      src={imageUrl}
                      alt={imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackText="Airport Image"
                    />
                    {/* Airport Code Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md">
                        {item.code}
                      </span>
                    </div>
                    {/* Category Badge */}
                    {item.category && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 bg-white/95 dark:bg-gray-900/95 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium shadow-sm">
                          {item.category.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                    {/* Featured Badge */}
                    {item.featured && (
                      <div className="absolute bottom-3 right-3">
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium shadow-sm">
                          <Star className="w-3 h-3" />
                          Featured
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    {/* Airport Name and Location */}
                    <div className="mb-3">
                      <h3 className="font-bold text-lg sm:text-xl mb-1.5 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 break-words">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm">{item.city}, {item.country}</span>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {renderTextContent(item.description) && (
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 text-sm leading-relaxed">
                        {renderTextContent(item.description)}
                      </p>
                    )}
                    
                    {/* Services Preview */}
                    {item.services && item.services.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {item.services.slice(0, 3).map((service: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs"
                            >
                              {service}
                            </span>
                          ))}
                          {item.services.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                              +{item.services.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">View Details</span>
                      <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              )
            }
            
            // Special handling for quiz cards
            if (activeTab === 'quizzes') {
              return (
                <QuizCard
                  key={item._id}
                  quiz={item}
                  onClick={() => handleCardClick(activeTab, item)}
                />
              )
            }
            
            // Special handling for resource cards
            if (activeTab === 'resources') {
              return (
                <ResourceCard
                  key={item._id}
                  resource={item}
                  onClick={() => handleCardClick(activeTab, item)}
                />
              )
            }
            
            // Special handling for travel advisory cards
            if (activeTab === 'advisories') {
              return (
                <TravelAdvisoryCard
                  key={item._id}
                  advisory={item}
                  onClick={() => handleCardClick(activeTab, item)}
                />
              )
            }
            
            // Special handling for aircraft cards
            if (activeTab === 'airplanes') {
              return (
                <article 
                  key={item._id}
                  onClick={() => handleCardClick(activeTab, item)}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden"
                >
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                    <ImageWithFallback
                      src={imageUrl}
                      alt={imageAlt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      fallbackText="Aircraft Image"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold shadow-lg">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{item.manufacturer}</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">{formatDate(item.publishedAt)}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight line-clamp-2 break-words">
                      {item.title || item.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 font-medium">
                      {item.manufacturer} {item.model}
                    </p>
                    
                    {/* Specifications Preview */}
                    {item.specifications && (
                      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        {item.specifications.maxPassengers && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {item.specifications.maxPassengers} pax
                            </span>
                          </div>
                        )}
                        {item.specifications.range && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {item.specifications.range.toLocaleString()} mi
                            </span>
                          </div>
                        )}
                        {item.specifications.cruiseSpeed && (
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {item.specifications.cruiseSpeed} mph
                            </span>
                          </div>
                        )}
                        {item.specifications.maxAltitude && (
                          <div className="flex items-center gap-2">
                            <Plane className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {item.specifications.maxAltitude.toLocaleString()} ft
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">View Details</span>
                      <ChevronRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              )
            }
            
            // Default card layout for other content types
            return (
              <article 
                key={item._id}
                onClick={() => handleCardClick(activeTab, item)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallbackText={`${activeTab} Image`}
                  />
                  {/* Category/Type Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-white/90 text-gray-700 rounded-full text-xs font-medium">
                      {item.category || activeTab}
                    </span>
                  </div>
                  {/* Featured/Breaking Badge */}
                  {(item.featured || item.breaking) && (
                    <div className="absolute top-4 right-4">
                      {item.breaking && (
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium animate-pulse">
                          Breaking
                        </span>
                      )}
                      {item.featured && !item.breaking && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                  )}
                  {/* Image Caption */}
                  {image && typeof image === 'object' && 'caption' in image && (image as any).caption && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-sm bg-black/50 rounded-lg p-2 line-clamp-2">
                        {(image as any).caption}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {/* Meta Information */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                    {item.source && <span>{item.source}</span>}
                    {item.author && item.source && <span className="text-gray-300 dark:text-gray-600">•</span>}
                    {item.author && <span>{item.author}</span>}
                    {item.publishedAt && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>{formatDate(item.publishedAt)}</span>
                      </>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 break-words">
                    {item.title || item.name}
                  </h3>
                  
                  {(() => {
                    const primary = renderTextContent(item.excerpt) || renderTextContent(item.description) || renderTextContent((item as any).content);
                    const parts = [item.city, item.country].filter(v => typeof v === 'string' && v.trim() && !/^na$/i.test(v) && !/^n\/a$/i.test(v));
                    const location = parts.join(', ');
                    const manufModel = [item.manufacturer, item.model].filter(Boolean).join(' ').trim();
                    const fallback = location || manufModel || '';
                    const text = (primary && primary.trim()) ? primary : fallback || 'Discover details';
                    return (
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                        {text}
                      </p>
                    );
                  })()}
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Learn More</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  const renderSearchResults = () => {
    if (!searchResults) return null

    const totalResults = Object.values(searchResults).flat().length

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Search Results</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{totalResults} results for "{searchQuery}"</span>
            <button 
              onClick={clearSearch}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Search
            </button>
          </div>
        </div>

        {Object.entries(searchResults).map(([category, items]) => {
          if (!Array.isArray(items) || items.length === 0) return null

          return (
            <section key={category}>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 capitalize">
                {category} ({items.length})
              </h3>
              <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
                {items.map((item: any) => {
                  // Check for images in multiple places - same logic as tab content
                  const image = item.images?.[0] || 
                               item.image || 
                               item.featuredImage ||
                               item.mainImage ||
                               item.photo ||
                               item.photos?.[0] ||
                               item.media ||
                               (item.description && Array.isArray(item.description) && item.description.find((block: any) => block._type === 'image'))
                  const imageUrl = image?.asset?.url
                  
                  return (
                    <article 
                      key={item._id}
                      onClick={() => handleCardClick(category, item)}
                      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                    >
                      <div className="relative h-32 overflow-hidden">
                        <ImageWithFallback
                          src={imageUrl}
                          alt={image?.alt || item.title || item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          fallbackText={`${category} Image`}
                        />
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-white/90 text-gray-700 rounded-full text-xs font-medium">
                            {item.category || category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {item.title || item.name}
                        </h4>
                        {(() => {
                          const primary = renderTextContent(item.excerpt) || renderTextContent(item.description) || renderTextContent((item as any).content);
                          const parts = [item.city, item.country].filter(v => typeof v === 'string' && v.trim() && !/^na$/i.test(v) && !/^n\/a$/i.test(v));
                          const location = parts.join(', ');
                          const manufModel = [item.manufacturer, item.model].filter(Boolean).join(' ').trim();
                          const fallback = location || manufModel || '';
                          const text = (primary && primary.trim()) ? primary : fallback || 'Discover details';
                          return (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                              {text}
                            </p>
                          );
                        })()}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 capitalize">{category}</span>
                            {item.breaking && (
                              <span className="px-1 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium">
                                Breaking
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-8">
            {/* Main Heading */}
            <div className="mb-6">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                AVIHUB
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4">
                Your comprehensive aviation hub featuring daily breaking news, detailed aircraft specifications, 
                airport guides, real-time flight alerts, and travel advisories.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Updated Daily
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  No Signup Required
                </span>
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-indigo-600" />
                  Free Forever
                </span>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search guides, aircraft, destinations, advisories, quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-12 pr-16 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 text-base shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              />
              
              {/* Search Actions */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {isSearching && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={handleSearch}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Search
                  </button>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                  {/* Search History */}
                  {searchHistory.length > 0 && (
                    <div className="p-3 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Searches</h4>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {searchHistory.slice(0, 3).map((historyItem, index) => (
                          <button
                            key={index}
                            onClick={() => handleHistoryClick(historyItem)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                          >
                            <Clock className="w-3 h-3 text-gray-400" />
                            {historyItem}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Suggestions */}
                  {searchSuggestions.length > 0 && (
                    <div className="p-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggestions</h4>
                      <div className="space-y-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                          >
                            <Search className="w-3 h-3 text-gray-400" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Search Categories */}
                  <div className="p-3 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Search</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Flight Training', icon: BookOpen },
                        { label: 'Aircraft Systems', icon: Plane },
                        { label: 'Weather', icon: Cloud },
                        { label: 'Safety', icon: Shield }
                      ].map((category, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(category.label)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                        >
                          <category.icon className="w-3 h-3 text-gray-400" />
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Filters */}
            {searchResults && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600">Filter by:</span>
                <select
                  value={searchFilters.type}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="guides">Guides</option>
                  <option value="aircraft">Aircraft</option>
                  <option value="airports">Airports</option>
                  <option value="advisories">Advisories</option>
                  <option value="quizzes">Quizzes</option>
                  <option value="resources">Resources</option>
                </select>
                <select
                  value={searchFilters.category}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="safety">Safety</option>
                  <option value="training">Training</option>
                  <option value="weather">Weather</option>
                  <option value="navigation">Navigation</option>
                  <option value="systems">Systems</option>
                </select>
                <select
                  value={searchFilters.dateRange}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 sticky top-16 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-3 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading content...</p>
          </div>
        )}

        {/* Content */}
        {!loading && renderTabContent()}
      </div>
    </div>
  )
}

export default AviationEducation