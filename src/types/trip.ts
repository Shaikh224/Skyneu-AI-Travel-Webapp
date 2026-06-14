export interface Trip {
  $id?: string;
  ownerId: string;
  title: string;
  destination: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  budget?: number;
  currency?: string; // Trip currency, defaults to USD
  status?: 'planning' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'over';
  memberCount?: number;
  isGroupTrip?: boolean;
  description?: string;
  image?: string;
  groupId?: string;
  joinCode?: string; // 6-character alphanumeric join code
  joinCodeEnabled?: boolean; // Whether join code is active
  createdAt?: string;
  updatedAt?: string;
}

export interface TripMember {
  $id?: string;
  tripId: string;
  userId?: string; // Optional for guest members
  guestId?: string; // For guest members (no authentication required)
  role: 'owner' | 'admin' | 'co-admin' | 'member' | 'viewer';
  name?: string;
  email?: string;
  avatar?: string;
  status?: 'active' | 'inactive' | 'pending' | 'declined';
  preferences?: string; // JSON string
  joinedAt?: string;
}

export interface TripActivity {
  $id?: string;
  tripId: string;
  title: string;
  description?: string;
  category: 'flight' | 'stay' | 'transport' | 'activity' | 'food' | 'other';
  date: string; // ISO datetime
  time?: string;
  location?: string;
  cost?: number;
  votes?: string; // JSON string
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  addedBy: string;
  aiGenerated?: boolean; // Distinguish AI-generated activities from user-created ones
  tags?: string; // JSON array string
  pollType?: 'simple' | 'ranked' | 'multiple';
  pollOptions?: string; // JSON string
  maxParticipants?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  duration?: string;
  bookingUrl?: string;
  bookingRequired?: boolean;
  popularity?: number;
  estimatedPreparationTime?: number;
  confirmed?: string; // JSON string of confirmed participants
  weatherDependent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  $id?: string;
  tripId: string;
  category?: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  completed: boolean;
  aiGenerated?: boolean;
  dependencies?: string; // JSON array string
  tips?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  $id?: string;
  tripId: string;
  payerId: string;
  amount: number;
  description: string;
  participants: string; // JSON array string
  splits: string; // JSON object string
  category?: 'food' | 'transport' | 'accommodation' | 'activity' | 'shopping' | 'other';
  currency?: string;
  receiptUrl?: string;
  aiGenerated?: boolean; // Distinguish AI-generated expenses from user-created ones
  createdAt?: string;
  updatedAt?: string;
}
