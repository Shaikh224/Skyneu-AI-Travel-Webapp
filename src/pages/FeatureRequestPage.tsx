import React, { useState, useEffect } from 'react';
import { Plus, Search, ThumbsUp, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { featureRequestService } from '@/services/featureRequestService';
import type { FeatureRequest, CreateFeatureRequest, FeatureRequestFilters } from '@/types/featureRequest';
import toast from 'react-hot-toast';

const FeatureRequestPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FeatureRequestFilters>({});
  const [stats, setStats] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<CreateFeatureRequest>({
    title: '',
    description: '',
    category: 'functionality',
    priority: 'medium'
  });


  const categories = [
    { value: 'ui', label: 'UI/UX', color: 'bg-blue-100 text-blue-800' },
    { value: 'functionality', label: 'Functionality', color: 'bg-green-100 text-green-800' },
    { value: 'integration', label: 'Integration', color: 'bg-purple-100 text-purple-800' },
    { value: 'performance', label: 'Performance', color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'under-review', label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    loadFeatureRequests();
    loadStats();
  }, [filters, searchTerm]);

  const loadFeatureRequests = async () => {
    try {
      setLoading(true);
      const requests = await featureRequestService.getFeatureRequests({
        ...filters,
        search: searchTerm || undefined
      });
      setFeatureRequests(requests);
    } catch (error) {
      console.error('Error loading feature requests:', error);
      toast.error('Failed to load feature requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await featureRequestService.getFeatureRequestStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to submit a feature request');
      return;
    }

    try {
      await featureRequestService.createFeatureRequest(
        formData,
        user?.$id,
        user?.email,
        user?.name
      );
      
      toast.success('Feature request submitted successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'functionality',
        priority: 'medium'
      });
      loadFeatureRequests();
      loadStats();
    } catch (error) {
      console.error('Error creating feature request:', error);
      toast.error('Failed to submit feature request');
    }
  };

  const handleVote = async (id: string) => {
    if (!isAuthenticated || !user?.$id) {
      toast.error('Please sign in to vote');
      return;
    }

    try {
      await featureRequestService.voteForFeatureRequest(id, user.$id);
      loadFeatureRequests();
      toast.success('Vote recorded!');
    } catch (error: any) {
      console.error('Error voting:', error);
      if (error.message === 'You have already voted for this feature request') {
        toast.error('You have already voted for this feature request');
      } else {
        toast.error('Failed to vote');
      }
    }
  };

  // tags removed

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'under-review': return <MessageSquare className="h-4 w-4" />;
      case 'in-progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 rounded-full mb-6 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
            <MessageSquare className="h-5 w-5 text-skyneu-blue dark:text-skyneu-green" />
            <span className="text-sm font-semibold text-skyneu-blue dark:text-skyneu-green uppercase tracking-wide">Community Feedback</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Feature Requests
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Help us improve SkyNeu by suggesting new features and improvements
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <div className="text-3xl font-bold bg-gradient-to-r from-skyneu-blue to-skyneu-green bg-clip-text text-transparent">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">Total Requests</div>
            </div>
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">Pending</div>
            </div>
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.inProgress}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">In Progress</div>
            </div>
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">Completed</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search feature requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-skyneu-blue focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-skyneu-blue focus:border-transparent transition-all"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-skyneu-blue focus:border-transparent transition-all"
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            >
              <Plus className="h-5 w-5" />
              Submit Request
            </button>
          </div>
        </div>

        {/* Feature Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-gray-700/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skyneu-blue mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading feature requests...</p>
            </div>
          ) : featureRequests.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-gray-700/50">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No feature requests found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">Be the first to suggest a new feature!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
              >
                <Plus className="h-5 w-5" />
                Submit First Request
              </button>
            </div>
          ) : (
            featureRequests.map((request) => (
              <div key={request.$id} className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-gray-700/50 hover:border-skyneu-blue/30 dark:hover:border-skyneu-blue/50 hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{request.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${categories.find(c => c.value === request.category)?.color}`}>
                          {categories.find(c => c.value === request.category)?.label}
                        </span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statuses.find(s => s.value === request.status)?.color}`}>
                          {getStatusIcon(request.status)}
                          <span>{statuses.find(s => s.value === request.status)?.label}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{request.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(request.userName || 'Anonymous')[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{request.userName || 'Anonymous'}</span>
                        </div>
                        <span>•</span>
                        {(() => {
                          const createdAtRaw: any = (request as any).$createdAt || (request as any).createdAt;
                          const d = createdAtRaw ? new Date(createdAtRaw) : null;
                          const dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                          return <span className="font-medium">{dateStr}</span>;
                        })()}
                        <span>•</span>
                        <span className={`font-semibold ${priorities.find(p => p.value === request.priority)?.color}`}>
                          {priorities.find(p => p.value === request.priority)?.label} Priority
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <button
                        onClick={() => handleVote(request.$id)}
                        disabled={!!(isAuthenticated && user?.$id && request.votedBy?.includes(user.$id))}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold ${
                          isAuthenticated && user?.$id && request.votedBy?.includes(user.$id)
                            ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white cursor-not-allowed opacity-75'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gradient-to-r hover:from-skyneu-blue hover:to-skyneu-green hover:text-white hover:shadow-md hover:scale-105 group'
                        }`}
                      >
                        <ThumbsUp className={`h-5 w-5 transition-transform ${
                          isAuthenticated && user?.$id && request.votedBy?.includes(user.$id) ? 'fill-current' : 'group-hover:scale-110'
                        }`} />
                        <span className="text-sm font-bold">{request.votes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700/50">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submit Feature Request</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-all"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateRequest} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-skyneu-blue focus:border-transparent transition-all"
                      placeholder="Brief description of your feature request"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-skyneu-blue focus:border-transparent transition-all resize-none"
                      placeholder="Detailed description of your feature request, including use cases and benefits"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-skyneu-blue focus:border-transparent transition-all"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                        Priority *
                      </label>
                      <select
                        required
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-skyneu-blue focus:border-transparent transition-all"
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* tags input removed */}

                  <div className="flex justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureRequestPage;
