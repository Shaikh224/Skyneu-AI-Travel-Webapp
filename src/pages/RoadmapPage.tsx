import React, { useState, useEffect } from 'react';
import { Map, Clock, CheckCircle, AlertCircle, Play, Pause, Star, Search } from 'lucide-react';
import { getRoadmapItems } from '../lib/queries';
import type { RoadmapItem } from '../types/sanity';
import AnnouncementBanner from '../components/AnnouncementBanner';

const RoadmapPage: React.FC = () => {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadRoadmapItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRoadmapItems();
        setRoadmapItems(data || []);
      } catch (error) {
        console.error('Error loading roadmap items:', error);
        setError('Failed to load roadmap items. Please try again later.');
        setRoadmapItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadRoadmapItems();
  }, []);

  const getStatusIcon = (status: string) => {
    const icons = {
      planned: <Clock className="h-4 w-4" />,
      'in-progress': <Play className="h-4 w-4" />,
      'in-review': <AlertCircle className="h-4 w-4" />,
      testing: <AlertCircle className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      'on-hold': <Pause className="h-4 w-4" />,
      cancelled: <AlertCircle className="h-4 w-4" />
    };
    return icons[status as keyof typeof icons] || <Clock className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      'in-review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      testing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      'on-hold': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredItems = roadmapItems.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter || item.category === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading roadmap...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Roadmap</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      <AnnouncementBanner page="roadmap" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 rounded-full mb-6 border border-skyneu-blue/20">
            <Map className="h-4 w-4 text-skyneu-blue" />
            <span className="text-sm font-semibold text-skyneu-blue">PRODUCT ROADMAP</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-skyneu-dark dark:text-dark-text mb-4">
            What We're Building
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Follow our development progress and see what's on the horizon. Your feedback shapes our roadmap.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-12 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {['all', 'feature', 'enhancement', 'completed'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === filterOption
                      ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filterOption === 'all' ? 'All Items' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1) + 's'}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search roadmap..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full lg:w-80 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-skyneu-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Roadmap Items */}
        <div className="space-y-6">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`bg-white dark:bg-dark-surface rounded-xl border ${
                item.featured 
                  ? 'border-skyneu-blue shadow-lg shadow-skyneu-blue/10' 
                  : 'border-gray-200 dark:border-gray-700'
              } hover:shadow-xl transition-all duration-300 overflow-hidden`}
            >
              {item.featured && (
                <div className="bg-gradient-to-r from-skyneu-blue to-skyneu-green px-6 py-2 flex items-center gap-2 text-white text-sm font-medium">
                  <Star className="h-4 w-4 fill-current" />
                  Featured
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-skyneu-dark dark:text-dark-text mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="capitalize">{item.status.replace('-', ' ')}</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getPriorityColor(item.priority)}`}>
                    {item.priority.toUpperCase()}
                  </div>
                  <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {item.category}
                  </div>
                  {item.assignee && (
                    <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue border border-skyneu-blue/20">
                      Assigned: {item.assignee}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Development Progress</span>
                    <span className="text-sm font-bold text-skyneu-blue">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-skyneu-blue to-skyneu-green h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>

                {/* Timeline */}
                {item.timeline && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    {item.timeline.startDate && (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Started</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                          {new Date(item.timeline.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {item.timeline.targetDate && (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Target Release</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                          {new Date(item.timeline.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {item.timeline.actualDate && (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Released</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                          {new Date(item.timeline.actualDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-gray-700">
            <Map className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Items Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search terms to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;
