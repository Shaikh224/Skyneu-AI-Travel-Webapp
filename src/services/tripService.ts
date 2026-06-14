import { ID, Query, databases, DATABASE_ID, TRIPS_COLLECTION_ID, ACTIVITIES_COLLECTION_ID, CHECKLIST_COLLECTION_ID, TRIP_MEMBERS_COLLECTION_ID } from '../lib/appwrite';
import type { Trip, TripActivity, ChecklistItem, TripMember, Expense } from '../types/trip';
import { generateChecklistWithGemini } from '../lib/gemini';

const tripService = {
  // Generate a unique 6-character join code
  generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Trips
  async createTrip(data: Omit<Trip, '$id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const now = new Date().toISOString();
    const joinCode = this.generateJoinCode();
    
    const doc = await databases.createDocument(DATABASE_ID, TRIPS_COLLECTION_ID, ID.unique(), { 
      ...data, 
      joinCode,
      joinCodeEnabled: false, // Disabled by default, can be enabled later
      createdAt: now, 
      updatedAt: now 
    });
    
    return doc as unknown as Trip;
  },

  async createTripWithOwner(tripData: Omit<Trip, '$id' | 'createdAt' | 'updatedAt'>, ownerInfo: { userId: string; email: string; name: string }): Promise<{ trip: Trip; member: TripMember }> {
    // Create the trip first
    const trip = await this.createTrip(tripData);
    
    // Add the owner as admin member
    const member = await this.addMember({
      tripId: trip.$id!,
      userId: ownerInfo.userId,
      role: 'owner',
      email: ownerInfo.email,
      name: ownerInfo.name,
      status: 'active'
    });

    return { trip, member };
  },

  async getTrip(id: string): Promise<Trip> {
    const doc = await databases.getDocument(DATABASE_ID, TRIPS_COLLECTION_ID, id);
    return doc as unknown as Trip;
  },

  async getUserTrips(userId: string): Promise<Trip[]> {
    // Get trips where user is a member
    const memberResponse = await databases.listDocuments(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.orderDesc('joinedAt')
    ]);

    const tripIds = memberResponse.documents.map(member => (member as any).tripId);
    
    if (tripIds.length === 0) return [];

    const tripsResponse = await databases.listDocuments(DATABASE_ID, TRIPS_COLLECTION_ID, [
      Query.contains('$id', tripIds),
      Query.orderDesc('createdAt')
    ]);

    return tripsResponse.documents as unknown as Trip[];
  },
  async updateTrip(id: string, data: Partial<Trip>): Promise<Trip> {
    const { $id, ...updateData } = data;
    const doc = await databases.updateDocument(DATABASE_ID, TRIPS_COLLECTION_ID, id, { ...updateData, updatedAt: new Date().toISOString() });
    return doc as unknown as Trip;
  },
  async deleteTrip(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, TRIPS_COLLECTION_ID, id);
  },

  // Join trip as authenticated viewer (no subscription required)
  async joinTripAsGuest(joinCode: string, userId: string, userName: string): Promise<{ trip: Trip; member: TripMember }> {
    console.log('🔗 Attempting to join trip as viewer with code:', joinCode, 'for user:', userName);
    
    try {
      // Find trip by join code
      const tripResponse = await databases.listDocuments(DATABASE_ID, TRIPS_COLLECTION_ID, [
        Query.equal('joinCode', joinCode),
        Query.equal('joinCodeEnabled', true)
      ]);
      
      if (tripResponse.documents.length === 0) {
        throw new Error('Invalid join code or code has been disabled');
      }
      
      const trip = tripResponse.documents[0] as unknown as Trip;
      
      // Check if user is already a member
      const existingMember = await databases.listDocuments(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, [
        Query.equal('tripId', trip.$id!),
        Query.equal('userId', userId)
      ]);
      
      if (existingMember.documents.length > 0) {
        console.log('✅ User already a member of this trip');
        return { trip, member: existingMember.documents[0] as unknown as TripMember };
      }
      
      // Add user as member with viewer role
      const member = await this.addMember({
        tripId: trip.$id!,
        userId: userId,
        role: 'viewer',
        name: userName,
        status: 'active'
      });
      
      console.log('✅ Successfully joined trip as viewer:', { trip: trip.title, user: userName });
      return { trip, member };
    } catch (error: any) {
      console.error('Error joining trip as viewer:', error);
      throw error;
    }
  },

  // Get trip by join code (for preview before joining)
  async getTripByJoinCode(joinCode: string): Promise<Trip | null> {
    try {
      const tripResponse = await databases.listDocuments(DATABASE_ID, TRIPS_COLLECTION_ID, [
        Query.equal('joinCode', joinCode),
        Query.equal('joinCodeEnabled', true)
      ]);
      
      if (tripResponse.documents.length > 0) {
        return tripResponse.documents[0] as unknown as Trip;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting trip by join code:', error);
      return null;
    }
  },

  // Join Code functionality
  async joinTripWithCode(joinCode: string, userInfo: { userId: string; email: string; name: string }): Promise<{ trip: Trip; member: TripMember }> {
    console.log('🔗 Attempting to join trip with code:', joinCode, 'for user:', userInfo.email);
    
    // Find trip by join code
    const tripResponse = await databases.listDocuments(DATABASE_ID, TRIPS_COLLECTION_ID, [
      Query.equal('joinCode', joinCode),
      Query.equal('joinCodeEnabled', true)
    ]);
    
    if (tripResponse.documents.length === 0) {
      throw new Error('Invalid join code or code has been disabled');
    }
    
    const trip = tripResponse.documents[0] as unknown as Trip;
    
    // Check if user is already a member
    const existingMember = await databases.listDocuments(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, [
      Query.equal('tripId', trip.$id!),
      Query.equal('userId', userInfo.userId)
    ]);
    
    if (existingMember.documents.length > 0) {
      throw new Error('You are already a member of this trip');
    }
    
    // Add user as member
    const member = await this.addMember({
      tripId: trip.$id!,
      userId: userInfo.userId,
      role: 'member', // Default role for joined members
      email: userInfo.email,
      name: userInfo.name,
      status: 'active'
    });
    
    // Send notifications to other trip members
    try {
      const { notificationManager } = await import('./notificationManager');
      const members = await this.getTripMembers(trip.$id!);
      const existingMembers = members.filter(m => m.userId !== userInfo.userId);
      
      // Notify all existing members about the new member
      for (const member of existingMembers) {
        await notificationManager.createNotificationForUser(member.userId, {
          title: 'New Member Joined',
          message: `${userInfo.name || userInfo.email || 'Someone'} joined your trip "${trip.title}"`,
          category: 'update',
          type: 'trip',
          priority: 'medium',
          data: {
            tripId: trip.$id,
            newMemberId: userInfo.userId,
            newMemberName: userInfo.name || userInfo.email || 'Unknown'
          },
          tripId: trip.$id,
          read: false
        });
      }
    } catch (error) {
      console.error('Error sending new member notification:', error);
    }
    
    console.log('✅ Successfully joined trip:', { trip: trip.title, member });
    return { trip, member };
  },

  async regenerateJoinCode(tripId: string): Promise<string> {
    const newCode = this.generateJoinCode();
    await databases.updateDocument(DATABASE_ID, TRIPS_COLLECTION_ID, tripId, {
      joinCode: newCode,
      updatedAt: new Date().toISOString()
    });
    return newCode;
  },

  async toggleJoinCode(tripId: string, enabled: boolean): Promise<Trip> {
    const doc = await databases.updateDocument(DATABASE_ID, TRIPS_COLLECTION_ID, tripId, {
      joinCodeEnabled: enabled,
      updatedAt: new Date().toISOString()
    });
    return doc as unknown as Trip;
  },

  // Members
  async addMember(data: Omit<TripMember, '$id' | 'joinedAt'>): Promise<TripMember> {
    const doc = await databases.createDocument(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, ID.unique(), { ...data, joinedAt: new Date().toISOString() });
    return doc as unknown as TripMember;
  },

  async addGuestMember(data: Omit<TripMember, '$id' | 'joinedAt' | 'userId'>): Promise<TripMember> {
    const doc = await databases.createDocument(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, ID.unique(), { ...data, joinedAt: new Date().toISOString() });
    return doc as unknown as TripMember;
  },
  async listMembers(tripId: string): Promise<TripMember[]> {
    const res = await databases.listDocuments(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, [Query.equal('tripId', tripId)]);
    return res.documents as unknown as TripMember[];
  },
  async getTripMembers(tripId: string): Promise<TripMember[]> {
    const res = await databases.listDocuments(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, [Query.equal('tripId', tripId)]);
    return res.documents as unknown as TripMember[];
  },
  async removeMember(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, id);
  },

  // Role Management
  async updateMemberRole(memberId: string, newRole: TripMember['role']): Promise<TripMember> {
    console.log('🔄 Updating member role:', { memberId, newRole });
    
    // Get current member to check their role
    const currentMember = await databases.getDocument(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, memberId);
    const currentRole = (currentMember as any).role;
    
    // Prevent changing viewer roles
    if (currentRole === 'viewer') {
      throw new Error('Cannot change viewer role - viewers must remain as viewers');
    }
    
    const doc = await databases.updateDocument(DATABASE_ID, TRIP_MEMBERS_COLLECTION_ID, memberId, {
      role: newRole
    });
    return doc as unknown as TripMember;
  },

  // Check if user has permission to manage roles
  canManageRoles(userRole: TripMember['role']): boolean {
    return ['owner', 'admin'].includes(userRole);
  },

  // Check if user can assign a specific role
  canAssignRole(assignerRole: TripMember['role'], targetRole: TripMember['role']): boolean {
    const hierarchy = {
      'owner': 5,
      'admin': 4,
      'co-admin': 3,
      'member': 2,
      'viewer': 1
    };
    
    // Owner can assign any role
    if (assignerRole === 'owner') return true;
    
    // Admin can assign roles below their level
    if (assignerRole === 'admin') {
      return hierarchy[targetRole] < hierarchy[assignerRole];
    }
    
    return false;
  },

  // Activities
  async createActivity(data: Omit<TripActivity, '$id' | 'createdAt' | 'updatedAt'>): Promise<TripActivity> {
    const now = new Date().toISOString();
    const doc = await databases.createDocument(DATABASE_ID, ACTIVITIES_COLLECTION_ID, ID.unique(), { ...data, createdAt: now, updatedAt: now });
    
    // Send notifications to other trip members
    try {
      const { notificationManager } = await import('./notificationManager');
      const trip = await this.getTrip(data.tripId);
      const members = await this.getTripMembers(data.tripId);
      const addedBy = members.find(m => m.userId === data.addedBy);
      
      if (trip && addedBy) {
        // Notify all members except the one who added the activity
        const otherMembers = members.filter(m => m.userId !== data.addedBy);
        for (const member of otherMembers) {
          await notificationManager.createNotificationForUser(member.userId, {
            title: 'New Activity Added',
            message: `${addedBy.name || addedBy.email || 'Someone'} added "${data.title}" to ${trip.title}`,
            category: 'update',
            type: 'trip',
            priority: 'medium',
            data: {
              tripId: data.tripId,
              activityId: doc.$id,
              activityTitle: data.title,
              activityDate: data.date,
              addedByName: addedBy.name || addedBy.email || 'Unknown'
            },
            tripId: data.tripId,
            read: false
          });
        }
      }
    } catch (error) {
      console.error('Error sending activity notification:', error);
    }
    
    return doc as unknown as TripActivity;
  },
  async getTripActivities(tripId: string): Promise<TripActivity[]> {
    const res = await databases.listDocuments(DATABASE_ID, ACTIVITIES_COLLECTION_ID, [Query.equal('tripId', tripId), Query.orderAsc('date')]);
    return res.documents as unknown as TripActivity[];
  },
  async updateActivity(id: string, data: Partial<TripActivity>): Promise<TripActivity> {
    const { $id, ...updateData } = data;
    const doc = await databases.updateDocument(DATABASE_ID, ACTIVITIES_COLLECTION_ID, id, { ...updateData, updatedAt: new Date().toISOString() });
    return doc as unknown as TripActivity;
  },
  async deleteActivity(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, ACTIVITIES_COLLECTION_ID, id);
  },

  // Checklist
  async createChecklistItem(data: Omit<ChecklistItem, '$id' | 'createdAt' | 'updatedAt'>): Promise<ChecklistItem> {
    const now = new Date().toISOString();
    const doc = await databases.createDocument(DATABASE_ID, CHECKLIST_COLLECTION_ID, ID.unique(), { ...data, createdAt: now, updatedAt: now });
    
    // Send notifications to trip members
    try {
      const { notificationManager } = await import('./notificationManager');
      const trip = await this.getTrip(data.tripId);
      const members = await this.getTripMembers(data.tripId);
      const addedBy = members.find(m => m.userId === data.assignedTo);
      
      if (trip && addedBy) {
        // Notify all members about the new checklist item
        for (const member of members) {
          await notificationManager.createNotificationForUser(member.userId, {
            title: 'New Checklist Item Added',
            message: `"${data.title}" was added to ${trip.title}${data.assignedTo ? ` and assigned to ${addedBy?.name || addedBy?.email || 'someone'}` : ''}`,
            category: 'update',
            type: 'trip',
            priority: 'medium',
            data: {
              tripId: data.tripId,
              itemId: doc.$id,
              itemTitle: data.title,
              action: 'added',
              assignedTo: data.assignedTo
            },
            tripId: data.tripId,
            read: false
          });
        }
      }
    } catch (error) {
      console.error('Error sending checklist notification:', error);
    }
    
    return doc as unknown as ChecklistItem;
  },
  async getTripChecklist(tripId: string): Promise<ChecklistItem[]> {
    const res = await databases.listDocuments(DATABASE_ID, CHECKLIST_COLLECTION_ID, [Query.equal('tripId', tripId)]);
    return res.documents as unknown as ChecklistItem[];
  },
  async updateChecklistItem(id: string, data: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const { $id, ...updateData } = data;
    const doc = await databases.updateDocument(DATABASE_ID, CHECKLIST_COLLECTION_ID, id, { ...updateData, updatedAt: new Date().toISOString() });
    
    // Send notifications for significant changes
    try {
      const { notificationManager } = await import('./notificationManager');
      const trip = await this.getTrip(doc.tripId);
      const members = await this.getTripMembers(doc.tripId);
      
      if (trip && members.length > 0) {
        // Check if item was completed
        if (data.completed !== undefined && data.completed) {
          const completedBy = members.find(m => m.userId === data.assignedTo);
          if (completedBy) {
            // Notify all members about completion
            for (const member of members) {
              await notificationManager.createNotificationForUser(member.userId, {
                title: 'Checklist Item Completed',
                message: `"${doc.title}" was completed by ${completedBy.name || completedBy.email || 'someone'} in ${trip.title}`,
                category: 'update',
                type: 'trip',
                priority: 'low',
                data: {
                  tripId: doc.tripId,
                  itemId: doc.$id,
                  itemTitle: doc.title,
                  action: 'completed',
                  completedBy: data.assignedTo
                },
                tripId: doc.tripId,
                read: false
              });
            }
          }
        }

        // Check if item was assigned to someone
        if (data.assignedTo && data.assignedTo !== doc.assignedTo) {
          const assignedTo = members.find(m => m.userId === data.assignedTo);
          if (assignedTo) {
            // Notify the newly assigned person
            await notificationManager.createNotificationForUser(data.assignedTo, {
              title: 'Checklist Item Assigned',
              message: `"${doc.title}" was assigned to you in ${trip.title}`,
              category: 'update',
              type: 'trip',
              priority: 'medium',
              data: {
                tripId: doc.tripId,
                itemId: doc.$id,
                itemTitle: doc.title,
                action: 'assigned',
                assignedTo: data.assignedTo
              },
              tripId: doc.tripId,
              read: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error sending checklist update notification:', error);
    }
    
    return doc as unknown as ChecklistItem;
  },
  async deleteChecklistItem(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, CHECKLIST_COLLECTION_ID, id);
  },

  // AI Checklist Generation
  async generateChecklist(trip: Trip): Promise<ChecklistItem[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
    const days = Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000*60*60*24)));
    const prompt = `Create a concise travel preparation checklist for a trip to ${trip.destination} for ${days} days. Group items by categories like Documents, Health, Clothing, Electronics, Money, Apps, and Essentials. 1 item per line.`;
    const items = await generateChecklistWithGemini(prompt, apiKey);
    const created: ChecklistItem[] = [];
    for (const title of items.slice(0, 50)) {
      const category = this.categorizeChecklistItem(title);
      const priority = this.prioritizeChecklistItem(title);
      const item = await this.createChecklistItem({ 
        tripId: trip.$id!, 
        title, 
        completed: false, 
        category, 
        priority,
        // Note: aiGenerated field removed as it's not in database schema 
      });
      created.push(item);
    }
    return created;
  },

  // Helper methods for AI-generated checklist items
  categorizeChecklistItem(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('passport') || lowerTitle.includes('visa') || lowerTitle.includes('id') || lowerTitle.includes('document')) return 'documents';
    if (lowerTitle.includes('vaccine') || lowerTitle.includes('medicine') || lowerTitle.includes('health') || lowerTitle.includes('insurance')) return 'health';
    if (lowerTitle.includes('cloth') || lowerTitle.includes('pack') || lowerTitle.includes('shoe') || lowerTitle.includes('wear')) return 'clothing';
    if (lowerTitle.includes('phone') || lowerTitle.includes('charger') || lowerTitle.includes('camera') || lowerTitle.includes('electronic')) return 'electronics';
    if (lowerTitle.includes('money') || lowerTitle.includes('card') || lowerTitle.includes('cash') || lowerTitle.includes('currency')) return 'money';
    if (lowerTitle.includes('app') || lowerTitle.includes('download') || lowerTitle.includes('translate')) return 'apps';
    return 'essentials';
  },

  prioritizeChecklistItem(title: string): ChecklistItem['priority'] {
    const lowerTitle = title.toLowerCase();
    const highPriority = ['passport', 'visa', 'ticket', 'booking', 'insurance', 'medication'];
    const mediumPriority = ['charger', 'adapter', 'currency', 'emergency'];
    
    if (highPriority.some(keyword => lowerTitle.includes(keyword))) return 'high';
    if (mediumPriority.some(keyword => lowerTitle.includes(keyword))) return 'medium';
    return 'low';
  },

  // Expenses
  async getTripExpenses(tripId: string): Promise<Expense[]> {
    const response = await databases.listDocuments(DATABASE_ID, 'expenses', [
      Query.equal('tripId', tripId),
      Query.orderDesc('createdAt')
    ]);
    return response.documents as unknown as Expense[];
  },

  async addExpense(data: Omit<Expense, '$id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const now = new Date().toISOString();
    const doc = await databases.createDocument(DATABASE_ID, 'expenses', ID.unique(), { 
      ...data, 
      createdAt: now, 
      updatedAt: now 
    });
    
        // Send notifications to participants
        try {
          const { notificationManager } = await import('./notificationManager');
          const trip = await this.getTrip(data.tripId);
          const members = await this.getTripMembers(data.tripId);
          const payer = members.find(m => m.userId === data.payerId);
          const participants = JSON.parse(data.participants);

          if (trip && payer) {
            // Create notification for each participant (except the payer)
            for (const participantId of participants) {
              if (participantId !== data.payerId) {
                await notificationManager.createNotificationForUser(participantId, {
                  title: 'New Expense Added',
                  message: `${payer.name || payer.email || 'Someone'} added "${data.description}" (${data.currency || 'USD'} ${data.amount}) to ${trip.title}`,
                  category: 'update',
                  type: 'trip',
                  priority: 'medium',
                  data: {
                    tripId: data.tripId,
                    expenseId: doc.$id,
                    expenseDescription: data.description,
                    amount: data.amount,
                    currency: data.currency || 'USD',
                    payerName: payer.name || payer.email || 'Unknown'
                  },
                  tripId: data.tripId,
                  read: false
                });
              }
            }
          }
        } catch (error) {
          console.error('Error sending expense notification:', error);
        }
    
    return doc as unknown as Expense;
  },

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    const { $id, ...updateData } = data;
    const doc = await databases.updateDocument(DATABASE_ID, 'expenses', id, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return doc as unknown as Expense;
  },

  async deleteExpense(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, 'expenses', id);
  }
};

export { tripService };
