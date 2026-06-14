export interface FeatureRequest {
  $id: string;
  title: string;
  description: string;
  category: 'ui' | 'functionality' | 'integration' | 'performance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'under-review' | 'in-progress' | 'completed' | 'rejected';
  userId?: string;
  userEmail?: string;
  userName?: string;
  votes: number;
  votedBy?: string[]; // Array of user IDs who have voted
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureRequest {
  title: string;
  description: string;
  category: 'ui' | 'functionality' | 'integration' | 'performance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface FeatureRequestFilters {
  category?: string;
  status?: string;
  priority?: string;
  search?: string;
}
