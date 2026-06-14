import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Download, ExternalLink, Star, Search, AlertCircle } from 'lucide-react';
import { getChangelogItems } from '../lib/queries';
import type { ChangelogItem } from '../types/sanity';
import AnnouncementBanner from '../components/AnnouncementBanner';

const ChangelogPage: React.FC = () => {
  const [changelogItems, setChangelogItems] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadChangelogItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getChangelogItems();
        setChangelogItems(data || []);
      } catch (error) {
        console.error('Error loading changelog items:', error);
        setError('Failed to load changelog items. Please try again later.');
        setChangelogItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadChangelogItems();
  }, []);

  const getChangeTypeIcon = (type: string) => {
    const icons = {
      feature: '✨',
      improvement: '⚡',
      bugfix: '🐛',
      security: '🔒',
      breaking: '💥',
      deprecation: '⚠️'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const getChangeTypeColor = (type: string) => {
    const colors = {
      feature: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      improvement: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      bugfix: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      security: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
      breaking: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
      deprecation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
    };
    return colors[impact as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredItems = changelogItems.filter(item => {
    const matchesFilter = filter === 'all' || 
      item.changes.some(change => change.type === filter) ||
      (filter === 'featured' && item.featured);
    const matchesSearch = item.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading changelog...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Changelog</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg py-16">
      <AnnouncementBanner page="changelog" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 rounded-full mb-6 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
            <FileText className="h-5 w-5 text-skyneu-blue dark:text-skyneu-green" />
            <span className="text-sm font-semibold text-skyneu-blue dark:text-skyneu-green uppercase tracking-wide">Product Updates</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Changelog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Stay updated with the latest changes, improvements, and new features in Skynfull.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-10 bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white shadow-lg shadow-skyneu-blue/25 scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                }`}
              >
                All Releases
              </button>
              <button
                onClick={() => setFilter('feature')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === 'feature'
                    ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white shadow-lg shadow-skyneu-blue/25 scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                }`}
              >
                ✨ Features
              </button>
              <button
                onClick={() => setFilter('improvement')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === 'improvement'
                    ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white shadow-lg shadow-skyneu-blue/25 scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                }`}
              >
                ⚡ Improvements
              </button>
              <button
                onClick={() => setFilter('bugfix')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === 'bugfix'
                    ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white shadow-lg shadow-skyneu-blue/25 scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                }`}
              >
                🐛 Bug Fixes
              </button>
              <button
                onClick={() => setFilter('featured')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === 'featured'
                    ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white shadow-lg shadow-skyneu-blue/25 scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                }`}
              >
                ⭐ Featured
              </button>
            </div>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search releases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-skyneu-blue focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Changelog Items */}
        <div className="space-y-6">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`bg-white dark:bg-dark-surface rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-xl ${
                item.featured 
                  ? 'border-skyneu-blue dark:border-skyneu-blue/50 shadow-lg shadow-skyneu-blue/10' 
                  : 'border-gray-200 dark:border-gray-700/50 hover:border-skyneu-blue/30'
              }`}
            >
              {item.featured && (
                <div className="bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white px-6 py-2 rounded-t-2xl flex items-center gap-2">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Featured Release</span>
                </div>
              )}
              
              <div className="p-8">
                {/* Version Header */}
                <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Version {item.version}
                      </h2>
                      {item.featured && !item.featured && ( /* Hide duplicate star if already shown in banner */
                        <Star className="h-6 w-6 text-yellow-500 fill-current" />
                      )}
                    </div>
                    {item.title && (
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        {item.title}
                      </h3>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {new Date(item.releaseDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700/50">
                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Changes */}
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    What's Changed
                  </h4>
                  {item.changes.map((change, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border-l-4 border-skyneu-blue dark:border-skyneu-green hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl flex-shrink-0">{getChangeTypeIcon(change.type)}</span>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-bold text-gray-900 dark:text-white text-lg">
                              {change.title}
                            </h5>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getChangeTypeColor(change.type)}`}>
                              {change.type}
                            </span>
                            {change.impact && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getImpactColor(change.impact)}`}>
                                {change.impact} impact
                              </span>
                            )}
                          </div>
                          {change.description && (
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                              {change.description}
                            </p>
                          )}
                          {change.affectedAreas && change.affectedAreas.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {change.affectedAreas.map((area, areaIndex) => (
                                <span
                                  key={areaIndex}
                                  className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Download Links */}
                {item.downloadLinks && item.downloadLinks.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700/50">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
                      Downloads
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {item.downloadLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                        >
                          <Download className="h-5 w-5" />
                          <span className="capitalize">{link.platform}</span>
                          {link.size && (
                            <span className="text-sm opacity-90">({link.size})</span>
                          )}
                          <ExternalLink className="h-4 w-4 opacity-75" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/50">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No releases found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangelogPage;
