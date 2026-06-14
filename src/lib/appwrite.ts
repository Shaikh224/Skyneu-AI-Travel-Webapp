import { Client, Account, Databases, Storage, Functions, ID, Query, OAuthProvider } from 'appwrite';
import { AppNotification, NotificationPreferences } from '@/types/notification';

// Initialize Appwrite Client with enhanced configuration
export const appwriteClient = new Client();

// Configure client with retry logic
appwriteClient
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Handle WebSocket connection management - do not subscribe to 'error' channel
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3; // Reduced to prevent spam
const RECONNECT_INTERVAL = 5000; // Increased to 5 seconds

function handleReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    setTimeout(() => {
      // Reinitialize the client
      appwriteClient
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
    }, RECONNECT_INTERVAL * reconnectAttempts);
  }
}

// Remove the error channel subscription - it's causing the WebSocket errors
// Only subscribe to specific valid channels (databases, functions, etc.)
// The 'error' channel is not a valid Appwrite realtime channel

// Initialize services with enhanced error handling
export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const storage = new Storage(appwriteClient);
export const functions = new Functions(appwriteClient);

// Helper function to subscribe to realtime updates with retry logic
export const subscribeToCollection = (
  databaseId: string,
  collectionId: string,
  callback: (payload: any) => void
) => {
  const channelId = `databases.${databaseId}.collections.${collectionId}.documents`;
  let unsubscribe: (() => void) | null = null;
  let retryCount = 0;
  const MAX_RETRIES = 5;

  const subscribe = () => {
    try {
      if (unsubscribe) {
        unsubscribe();
      }

      unsubscribe = appwriteClient.subscribe(channelId, (response: any) => {
        if (response.events?.includes('databases.*.collections.*.documents.*')) {
          try {
            callback(response);
            // Reset retry count on successful callback
            retryCount = 0;
          } catch (error) {
            console.warn('Subscription callback error:', error);
          }
        }
      });
    } catch (error) {
      console.warn('Subscription setup error:', error);
      
      // Implement exponential backoff for retries
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        setTimeout(subscribe, delay);
      }
    }
  };

  subscribe();

  // Return cleanup function
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const USER_PREFERENCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_PREFERENCES_COLLECTION_ID;
// Trip Planner Collections
export const TRIPS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID;
export const ACTIVITIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ACTIVITIES_COLLECTION_ID;
export const CHECKLIST_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CHECKLIST_COLLECTION_ID;
export const TRIP_MEMBERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TRIP_MEMBERS_COLLECTION_ID;
export const EXPENSES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_EXPENSES_COLLECTION_ID;
export const SAVED_FLIGHTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SAVED_FLIGHTS_COLLECTION_ID;
export const SHARE_CARDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SHARE_CARDS_COLLECTION_ID;
// Notification Center Collections
export const NOTIFICATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;
export const NOTIFICATION_PREFERENCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NOTIFICATION_PREFERENCES_COLLECTION_ID;

// Types for user data - Enhanced while maintaining backward compatibility
export interface UserPreferences {
  $id?: string; // Appwrite document ID
  
  // Existing attributes (keep as-is) - Arrays stored as JSON strings in Appwrite
  userId: string;
  email: string;
  name: string;
  preferredDestinations: string[] | string; // JSON parsed from string attribute or string
  frequentAirlines: string[] | string; // JSON parsed from string attribute or string  
  homeAirport?: string;
  travelClass: string; // economy, premium-economy, business, first
  travelPurpose: string; // leisure, business, both
  defaultCurrency: string; // USD, EUR, etc.
  interests: string[] | string; // JSON parsed from string attribute or string
  newsAlerts: boolean;
  flightAlerts: boolean;
  weatherAlerts: boolean;
  priceAlerts: boolean;
  timeZone?: string;
  language: string; // en, es, fr, etc.
  createdAt: string;
  updatedAt: string;
  
  // New enhanced attributes for hyperpersonalization
  
  // Personal Profile Extensions
  phone?: string;
  location?: string;
  bio?: string;
  dateOfBirth?: string;
  avatar?: string;
  
  // Enhanced Travel Style & Preferences
  travelStyle?: 'Luxury' | 'Premium' | 'Comfort' | 'Mixed' | 'Budget' | 'Backpacker';
  budgetRange?: 'Budget' | 'Low' | 'Medium' | 'High' | 'Luxury';
  accommodationType?: 'Hotel' | 'Resort' | 'Boutique Hotel' | 'Hostel' | 'Airbnb' | 'Bed & Breakfast' | 'Apartment';
  groupTravelPreference?: 'Solo' | 'Couple' | 'Family' | 'Friends' | 'Business' | 'Mixed';
  
  // Activity & Fitness Preferences
  activityTypes?: string[] | string; // JSON parsed from string attribute or string
  fitnessLevel?: 'Low' | 'Moderate' | 'High' | 'Very High';
  riskTolerance?: 'Low' | 'Medium' | 'High' | 'Very High';
  
  // Health & Accessibility
  mobility?: 'Full' | 'Limited' | 'Wheelchair' | 'Assistance';
  dietaryRestrictions?: string[] | string; // JSON parsed from string attribute or string
  weatherPreference?: 'Hot' | 'Warm' | 'Mild' | 'Cool' | 'Cold';
  
  // Transportation Preferences (Phase 2)
  seatPreference?: 'Window' | 'Aisle' | 'Middle' | 'Exit Row';
  carRentalPreference?: 'Economy' | 'Compact' | 'Midsize' | 'SUV' | 'Luxury' | 'No Car';
  
  // Planning & Booking Style (Phase 2)
  planningStyle?: 'Detailed' | 'Structured' | 'Loose' | 'Spontaneous';
  bookingLeadTime?: 'Last Minute' | 'Short Term' | '1-3 months' | '3-6 months' | '6+ months';
  flexibilityLevel?: 'Low' | 'Moderate' | 'High' | 'Very High';
  
  // Experience Priorities (Phase 2)
  experiencePriority?: 'Culture' | 'Adventure' | 'Relaxation' | 'Food' | 'Nature' | 'History' | 'Photography' | 'Socializing';
  luxuryLevel?: 'Budget' | 'Basic' | 'Moderate' | 'High' | 'Ultra Luxury';
  authenticityPreference?: 'Low' | 'Medium' | 'High' | 'Very High';
  
  // Technology & Social (Phase 2)
  techComfort?: 'Low' | 'Medium' | 'High' | 'Expert';
  socialPreference?: 'Low' | 'Moderate' | 'High' | 'Very High';
  culturalSensitivity?: 'Low' | 'Medium' | 'High' | 'Very High';
  
  // Additional Notifications
  destinationInsights?: boolean;
  personalizedTips?: boolean;
  communityUpdates?: boolean;
  weeklyDigest?: boolean;
  
  // Business Travel
  businessTraveler?: boolean;
}

// Helper type for saving to Appwrite (arrays as JSON strings)
export interface UserPreferencesForSave extends Omit<UserPreferences, 'preferredDestinations' | 'frequentAirlines' | 'interests' | 'activityTypes' | 'dietaryRestrictions'> {
  preferredDestinations?: string;
  frequentAirlines?: string;
  interests?: string;
  activityTypes?: string;
  dietaryRestrictions?: string;
}

export interface AuthUser {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
}

// Auth functions
export const authService = {
  // Create account
  async createAccount(email: string, password: string, name: string) {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      
      // Send verification email (optional, don't fail if this doesn't work)
      try {
        await account.createVerification(window.location.origin + '/verify-email');
      } catch (verificationError: any) {
        // Log but don't fail account creation if verification email fails
        console.warn('Verification email failed:', verificationError);
      }
      
      return user;
    } catch (error) {
      console.error('Account creation error:', error);
      throw error;
    }
  },

  // Login
  async login(email: string, password: string) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await account.get();
      return user as AuthUser;
    } catch (error: any) {
      // Suppress expected authentication errors for guests
      if (error.code === 401 || error.message?.includes('missing scopes') || error.message?.includes('Unauthorized')) {
        // User is not authenticated, which is expected for guests
        return null;
      } else {
        console.error('Get current user error:', error);
        return null;
      }
    }
  },

  // Update password
  async updatePassword(oldPassword: string, newPassword: string) {
    try {
      return await account.updatePassword(newPassword, oldPassword);
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  // Send password recovery email
  async sendPasswordRecovery(email: string) {
    try {
      return await account.createRecovery(email, window.location.origin + '/reset-password');
    } catch (error) {
      console.error('Password recovery error:', error);
      throw error;
    }
  },

  // Google OAuth login
  async loginWithGoogle() {
    try {
      // Create OAuth2 session with Google
      await account.createOAuth2Session(
        OAuthProvider.Google,
        `${window.location.origin}/auth/success`, // success redirect
        `${window.location.origin}/auth/failure`  // failure redirect
      );
    } catch (error) {
      console.error('Google OAuth login error:', error);
      throw error;
    }
  },

  // Get OAuth session info
  async getOAuthSession() {
    try {
      const session = await account.getSession('current');
      return {
        provider: session.provider,
        providerUid: session.providerUid,
        providerAccessToken: session.providerAccessToken,
        providerAccessTokenExpiry: session.providerAccessTokenExpiry
      };
    } catch (error) {
      console.error('Get OAuth session error:', error);
      return null;
    }
  },

  // Refresh OAuth session
  async refreshOAuthSession() {
    try {
      return await account.updateSession('current');
    } catch (error) {
      console.error('Refresh OAuth session error:', error);
      throw error;
    }
  }
};

// User preferences functions
export const userPreferencesService = {
  // Create user preferences
  async createUserPreferences(preferences: Omit<UserPreferences, 'createdAt' | 'updatedAt'>) {
    try {
      const now = new Date().toISOString();
      const { $id, ...cleanPreferences } = preferences as any;
      const document = await databases.createDocument(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        ID.unique(),
        {
          ...cleanPreferences,
          createdAt: now,
          updatedAt: now
        }
      );
      return document as unknown as UserPreferences;
    } catch (error) {
      console.error('Create user preferences error:', error);
      throw error;
    }
  },

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      
      if (response.documents.length > 0) {
        return response.documents[0] as unknown as UserPreferences;
      }
      
      return null;
    } catch (error) {
      console.error('Get user preferences error:', error);
      throw error;
    }
  },

  // Update user preferences
  async updateUserPreferences(documentId: string, preferences: Partial<UserPreferences>) {
    try {
      const { $id, $createdAt, $updatedAt, $collectionId, $databaseId, $permissions, ...cleanPreferences } = preferences as any;
      const document = await databases.updateDocument(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        documentId,
        {
          ...cleanPreferences,
          updatedAt: new Date().toISOString()
        }
      );
      return document as unknown as UserPreferences;
    } catch (error) {
      console.error('Update user preferences error:', error);
      throw error;
    }
  },

  // Delete user preferences
  async deleteUserPreferences(documentId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        documentId
      );
    } catch (error) {
      console.error('Delete user preferences error:', error);
      throw error;
    }
  }
};

// Flight Data Types - Simplified for efficient storage
export interface SavedFlight {
  $id?: string;
  userId: string;
  flightNumber: string;
  flight: {
    number: string;
    iataNumber: string;
    icaoNumber: string;
  };
  airline: {
    name: string;
    iataCode: string;
    logoUrl?: string;
  };
  departure: {
    airport: string;
    airportName?: string;
    airportCity?: string;
    airportCountry?: string;
    scheduledTime?: string;
    actualTime?: string;
    estimatedTime?: string;
    gate?: string;
    terminal?: string;
    delay?: number;
  };
  arrival: {
    airport: string;
    airportName?: string;
    airportCity?: string;
    airportCountry?: string;
    scheduledTime?: string;
    actualTime?: string;
    estimatedTime?: string;
    gate?: string;
    terminal?: string;
    baggage?: string;
    delay?: number;
  };
  status: string;
  aircraft?: {
    type?: string;
    registration?: string;
  };
  isFutureFlight?: boolean;
  isLive?: boolean;
  searchDate?: string;
  savedAt: string;
}

// Flight service functions
export const flightService = {
  // Save a flight
  async saveFlight(flight: Omit<SavedFlight, 'savedAt' | '$id'>): Promise<SavedFlight> {
    try {
      const now = new Date().toISOString();
      
      // Convert JSON objects to strings for Appwrite storage
      const flightData = {
        ...flight,
        savedAt: now,
        // Convert JSON objects to strings
        flight: JSON.stringify(flight.flight),
        airline: JSON.stringify(flight.airline),
        departure: JSON.stringify(flight.departure),
        arrival: JSON.stringify(flight.arrival),
        aircraft: flight.aircraft ? JSON.stringify(flight.aircraft) : undefined
      };
      
      const document = await databases.createDocument(
        DATABASE_ID,
        SAVED_FLIGHTS_COLLECTION_ID,
        ID.unique(),
        flightData
      );
      return document as unknown as SavedFlight;
    } catch (error) {
      console.error('Save flight error:', error);
      throw error;
    }
  },

  // Get all saved flights for a user
  async getSavedFlights(userId: string): Promise<SavedFlight[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SAVED_FLIGHTS_COLLECTION_ID,
        [Query.equal('userId', userId), Query.orderDesc('savedAt')]
      );
      
      // Parse JSON strings back to objects with error handling
      const flights = response.documents.map(doc => {
        const flight = doc as any;
        try {
          return {
            ...flight,
            flight: flight.flight ? JSON.parse(flight.flight) : null,
            airline: flight.airline ? JSON.parse(flight.airline) : null,
            departure: flight.departure ? JSON.parse(flight.departure) : null,
            arrival: flight.arrival ? JSON.parse(flight.arrival) : null,
            aircraft: flight.aircraft ? JSON.parse(flight.aircraft) : undefined
          } as SavedFlight;
        } catch (parseError) {
          console.warn('Error parsing flight data for', flight.$id, parseError);
          // Return flight with fallback data
          return {
            ...flight,
            flight: null,
            airline: null,
            departure: null,
            arrival: null,
            aircraft: undefined
          } as SavedFlight;
        }
      });
      
      return flights;
    } catch (error) {
      console.error('Get saved flights error:', error);
      throw error;
    }
  },

  // Get a specific saved flight
  async getSavedFlight(documentId: string): Promise<SavedFlight | null> {
    try {
      const document = await databases.getDocument(
        DATABASE_ID,
        SAVED_FLIGHTS_COLLECTION_ID,
        documentId
      );
      
      // Parse JSON strings back to objects
      const flight = document as any;
      return {
        ...flight,
        flight: JSON.parse(flight.flight),
        airline: JSON.parse(flight.airline),
        departure: JSON.parse(flight.departure),
        arrival: JSON.parse(flight.arrival),
        aircraft: flight.aircraft ? JSON.parse(flight.aircraft) : undefined
      } as SavedFlight;
    } catch (error) {
      console.error('Get saved flight error:', error);
      return null;
    }
  },

  // Update a saved flight
  async updateSavedFlight(documentId: string, updates: Partial<SavedFlight>): Promise<SavedFlight> {
    try {
      // Convert JSON objects to strings if they exist in updates
      const updateData: any = { ...updates };
      if (updates.flight) updateData.flight = JSON.stringify(updates.flight);
      if (updates.airline) updateData.airline = JSON.stringify(updates.airline);
      if (updates.departure) updateData.departure = JSON.stringify(updates.departure);
      if (updates.arrival) updateData.arrival = JSON.stringify(updates.arrival);
      if (updates.aircraft) updateData.aircraft = JSON.stringify(updates.aircraft);
      
      const document = await databases.updateDocument(
        DATABASE_ID,
        SAVED_FLIGHTS_COLLECTION_ID,
        documentId,
        updateData
      );
      
      // Parse JSON strings back to objects
      const flight = document as any;
      return {
        ...flight,
        flight: JSON.parse(flight.flight),
        airline: JSON.parse(flight.airline),
        departure: JSON.parse(flight.departure),
        arrival: JSON.parse(flight.arrival),
        aircraft: flight.aircraft ? JSON.parse(flight.aircraft) : undefined
      } as SavedFlight;
    } catch (error) {
      console.error('Update saved flight error:', error);
      throw error;
    }
  },

  // Delete a saved flight
  async deleteSavedFlight(documentId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        SAVED_FLIGHTS_COLLECTION_ID,
        documentId
      );
    } catch (error) {
      console.error('Delete saved flight error:', error);
      throw error;
    }
  },

  // Check if a flight is already saved
  async isFlightSaved(userId: string, flightNumber: string, searchDate?: string): Promise<boolean> {
    try {
      const queries = [
        Query.equal('userId', userId),
        Query.equal('flightNumber', flightNumber)
      ];
      
      if (searchDate) {
        queries.push(Query.equal('searchDate', searchDate));
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        SAVED_FLIGHTS_COLLECTION_ID,
        queries
      );
      
      return response.documents.length > 0;
    } catch (error) {
      console.error('Check if flight saved error:', error);
      return false;
    }
  }
};

// Notification service
export const notificationService = {
  // Create a new notification
  async createNotification(notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>) {
    try {
      const notificationData = {
        userId: notification.userId,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        data: notification.data ? JSON.stringify(notification.data) : null,
        priority: notification.priority,
        read: notification.read,
        flightNumber: notification.flightNumber || null,
        tripId: notification.tripId || null,
        visaId: notification.visaId || null,
        actionUrl: notification.actionUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        notificationData
      );

      return result;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  },

  // Get notifications for a user
  async getNotificationsByUser(userId: string, limit: number = 50) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
          Query.limit(limit)
        ]
      );

      // Parse data field from JSON string
      const notifications = result.documents.map(doc => ({
        ...doc,
        data: doc.data ? JSON.parse(doc.data) : null
      }));

      return notifications;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      // Delete instead of mark read to satisfy requirement
      await databases.deleteDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        notificationId
      );

      return { success: true } as any;
    } catch (error) {
      console.error('Delete notification on read error:', error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    try {
      // Get all unread notifications for the user
      const unreadNotifications = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('read', false)
        ]
      );

      // Delete each unread notification
      const deletePromises = unreadNotifications.documents.map(doc =>
        databases.deleteDocument(
          DATABASE_ID,
          NOTIFICATIONS_COLLECTION_ID,
          doc.$id
        )
      );

      await Promise.all(deletePromises);
      return { success: true, deletedCount: unreadNotifications.documents.length };
    } catch (error) {
      console.error('Delete all unread notifications error:', error);
      throw error;
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        notificationId
      );
      return { success: true };
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  },

  // Get unread count for a user
  async getUnreadCount(userId: string) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('read', false)
        ]
      );

      return result.documents.length;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }
};

// Notification preferences service
export const notificationPreferencesService = {
  // Get user notification preferences
  async getPreferences(userId: string) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATION_PREFERENCES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (result.documents.length > 0) {
        return result.documents[0];
      }

      // Return default preferences if none exist
      return this.createDefaultPreferences(userId);
    } catch (error) {
      console.error('Get notification preferences error:', error);
      return this.createDefaultPreferences(userId);
    }
  },

  // Create default preferences
  async createDefaultPreferences(userId: string) {
    try {
      const defaultPreferences = {
        userId,
        flightDelays: true,
        flightDelaysThreshold: 15,
        gateChanges: true,
        statusChanges: true,
        cancellations: true,
        tripReminders: true,
        tripReminderHours: 24,
        tripUpdates: true,
        visaDeadlines: true,
        visaDeadlineDays: 30,
        visaUpdates: true,
        browserNotifications: true,
        emailNotifications: false,
        pushNotifications: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        NOTIFICATION_PREFERENCES_COLLECTION_ID,
        ID.unique(),
        defaultPreferences
      );

      return result;
    } catch (error) {
      console.error('Create default preferences error:', error);
      throw error;
    }
  },

  // Update notification preferences
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    try {
      // Get existing preferences
      const existing = await this.getPreferences(userId);
      
      // Sanitize disallowed fields from update payload
      const { $id: _dropId, createdAt: _dropCreatedAt, updatedAt: _dropUpdatedAt, userId: _ignoreUserId, ...allowed } = (preferences as any) || {};

      const updatedPreferences: Record<string, any> = {
        ...allowed,
        updatedAt: new Date().toISOString()
      };

      const result = await databases.updateDocument(
        DATABASE_ID,
        NOTIFICATION_PREFERENCES_COLLECTION_ID,
        existing.$id,
        updatedPreferences
      );

      return result;
    } catch (error) {
      console.error('Update notification preferences error:', error);
      throw error;
    }
  }
};

export { ID, Query };
export default appwriteClient;
