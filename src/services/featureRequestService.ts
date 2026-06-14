import { databases, ID, Query } from '@/lib/appwrite';
import type { FeatureRequest, CreateFeatureRequest, FeatureRequestFilters } from '@/types/featureRequest';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'featureRequests';

export const featureRequestService = {
  // Create a new feature request
  async createFeatureRequest(data: CreateFeatureRequest, userId?: string, userEmail?: string, userName?: string) {
    try {
      const featureRequest = {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'pending',
        userId: userId || null,
        userEmail: userEmail || null,
        userName: userName || null,
        votes: 0,
        votedBy: [], // Initialize empty array for tracking voters
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        featureRequest
      );

      return result as unknown as FeatureRequest;
    } catch (error) {
      console.error('Error creating feature request:', error);
      throw error;
    }
  },

  // Get all feature requests with optional filters
  async getFeatureRequests(filters: FeatureRequestFilters = {}, limit = 50, offset = 0) {
    try {
      let queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('$createdAt')
      ];

      // Apply filters
      if (filters.category) {
        queries.push(Query.equal('category', filters.category));
      }
      if (filters.status) {
        queries.push(Query.equal('status', filters.status));
      }
      if (filters.priority) {
        queries.push(Query.equal('priority', filters.priority));
      }
      if (filters.search) {
        queries.push(Query.search('title', filters.search));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        queries
      );

      return result.documents as unknown as FeatureRequest[];
    } catch (error) {
      console.error('Error fetching feature requests:', error);
      throw error;
    }
  },

  // Get a single feature request by ID
  async getFeatureRequestById(id: string) {
    try {
      const result = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      );

      return result as unknown as FeatureRequest;
    } catch (error) {
      console.error('Error fetching feature request:', error);
      throw error;
    }
  },

  // Vote for a feature request
  async voteForFeatureRequest(id: string, userId: string) {
    try {
      const featureRequest = await this.getFeatureRequestById(id);
      
      // Initialize votedBy array if it doesn't exist (for backward compatibility)
      const votedBy = featureRequest.votedBy || [];
      
      // Check if user has already voted
      if (votedBy.includes(userId)) {
        throw new Error('You have already voted for this feature request');
      }
      
      // Add user to votedBy array and increment vote count
      const updatedVotedBy = [...votedBy, userId];
      const newVoteCount = featureRequest.votes + 1;

      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id,
        {
          votes: newVoteCount,
          votedBy: updatedVotedBy
        }
      );

      return result as unknown as FeatureRequest;
    } catch (error) {
      console.error('Error voting for feature request:', error);
      throw error;
    }
  },

  // Check if user has voted for a feature request
  async hasUserVoted(id: string, userId: string): Promise<boolean> {
    try {
      const featureRequest = await this.getFeatureRequestById(id);
      const votedBy = featureRequest.votedBy || [];
      return votedBy.includes(userId);
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  },

  // Get feature requests by user
  async getFeatureRequestsByUser(userId: string) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt')
        ]
      );

      return result.documents as unknown as FeatureRequest[];
    } catch (error) {
      console.error('Error fetching user feature requests:', error);
      throw error;
    }
  },

  // Get popular feature requests (most voted)
  async getPopularFeatureRequests(limit = 10) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.orderDesc('votes'),
          Query.limit(limit)
        ]
      );

      return result.documents as unknown as FeatureRequest[];
    } catch (error) {
      console.error('Error fetching popular feature requests:', error);
      throw error;
    }
  },

  // Get feature request statistics
  async getFeatureRequestStats() {
    try {
      const allRequests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.limit(1000)] // Get all for stats
      );

      const requests = allRequests.documents as unknown as FeatureRequest[];
      
      const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        inProgress: requests.filter(r => r.status === 'in-progress').length,
        completed: requests.filter(r => r.status === 'completed').length,
        byCategory: {
          ui: requests.filter(r => r.category === 'ui').length,
          functionality: requests.filter(r => r.category === 'functionality').length,
          integration: requests.filter(r => r.category === 'integration').length,
          performance: requests.filter(r => r.category === 'performance').length,
          other: requests.filter(r => r.category === 'other').length,
        },
        byPriority: {
          low: requests.filter(r => r.priority === 'low').length,
          medium: requests.filter(r => r.priority === 'medium').length,
          high: requests.filter(r => r.priority === 'high').length,
          critical: requests.filter(r => r.priority === 'critical').length,
        }
      };

      return stats;
    } catch (error) {
      console.error('Error fetching feature request stats:', error);
      throw error;
    }
  }
};
