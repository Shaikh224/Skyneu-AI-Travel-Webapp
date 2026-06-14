/**
 * Share Card Service
 * Manages public shareable flight status cards
 */

import { ID, Query } from 'appwrite';
import { databases, functions, SHARE_CARDS_COLLECTION_ID, DATABASE_ID } from '@/lib/appwrite';

export interface ShareCard {
  $id?: string;
  slug: string;
  flight_ref: string;
  owner_id: string;
  expires_at: string;
  status: 'active' | 'paused' | 'revoked';
  allow_name: boolean;
  allow_seat: boolean;
  custom_message?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface PublicFlightData {
  flightNumber: string;
  route: {
    departure: {
      airport: string;
      city?: string;
      country?: string;
      gate?: string;
      terminal?: string;
      scheduledTime?: string;
      actualTime?: string;
      estimatedTime?: string;
    };
    arrival: {
      airport: string;
      city?: string;
      country?: string;
      gate?: string;
      terminal?: string;
      scheduledTime?: string;
      actualTime?: string;
      estimatedTime?: string;
    };
  };
  status: string;
  aircraft?: {
    model?: string;
    registration?: string;
    airline?: string;
  };
  passengerInitials?: string;
  seat?: string;
  customMessage?: string;
  lastUpdated: string;
}

export interface CreateShareCardData {
  flight_ref: string;
  expires_at: string;
  allow_name: boolean;
  allow_seat: boolean;
  custom_message?: string;
}

class ShareCardService {
  private databaseId = DATABASE_ID;
  private shareCardsCollectionId = SHARE_CARDS_COLLECTION_ID;

  /**
   * Generate a cryptographically secure slug
   */
  private generateSlug(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(32); // 256 bits of entropy
    crypto.getRandomValues(array);
    
    for (let i = 0; i < array.length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }

  /**
   * Create a new share card
   */
  async createShareCard(data: CreateShareCardData, userId: string): Promise<ShareCard> {
    try {
      const slug = this.generateSlug();
      
      const shareCard = await databases.createDocument(
        this.databaseId,
        this.shareCardsCollectionId,
        ID.unique(),
        {
          slug,
          flight_ref: data.flight_ref,
          owner_id: userId,
          expires_at: data.expires_at,
          status: 'active',
          allow_name: data.allow_name,
          allow_seat: data.allow_seat,
          custom_message: data.custom_message || '',
        }
      );

      return shareCard as unknown as ShareCard;
    } catch (error) {
      console.error('Error creating share card:', error);
      throw new Error('Failed to create share card');
    }
  }

  /**
   * Get share cards for a user
   */
  async getUserShareCards(userId: string): Promise<ShareCard[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.shareCardsCollectionId,
        [
          Query.equal('owner_id', userId),
          Query.orderDesc('$createdAt'),
        ]
      );

      return response.documents as unknown as ShareCard[];
    } catch (error) {
      console.error('Error fetching user share cards:', error);
      throw new Error('Failed to fetch share cards');
    }
  }

  /**
   * Update share card status
   */
  async updateShareCardStatus(shareCardId: string, status: 'active' | 'paused' | 'revoked'): Promise<ShareCard> {
    try {
      const updatedCard = await databases.updateDocument(
        this.databaseId,
        this.shareCardsCollectionId,
        shareCardId,
        {
          status,
        }
      );

      return updatedCard as unknown as ShareCard;
    } catch (error) {
      console.error('Error updating share card status:', error);
      throw new Error('Failed to update share card status');
    }
  }

  /**
   * Delete a share card
   */
  async deleteShareCard(shareCardId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.shareCardsCollectionId,
        shareCardId
      );
    } catch (error) {
      console.error('Error deleting share card:', error);
      throw new Error('Failed to delete share card');
    }
  }

  /**
   * Get public flight data by slug (via Appwrite Function)
   */
  async getPublicFlightData(slug: string): Promise<PublicFlightData> {
    try {
      const response = await functions.createExecution(
        '68b868010005a339cd6e', // Function ID
        JSON.stringify({ slug }),
        false
      );

      console.log('Function response:', {
        statusCode: response.responseStatusCode,
        body: response.responseBody,
        duration: response.duration
      });

      if (response.responseStatusCode === 200) {
        return JSON.parse(response.responseBody);
      } else if (response.responseStatusCode === 410) {
        throw new Error('Share link has expired or been revoked');
      } else {
        // More detailed error message
        let errorMessage = 'Failed to fetch flight data';
        try {
          const errorBody = JSON.parse(response.responseBody);
          if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch (e) {
          // If response body isn't JSON, use the raw body
          if (response.responseBody) {
            errorMessage = response.responseBody;
          }
        }
        throw new Error(`${errorMessage} (Status: ${response.responseStatusCode})`);
      }
    } catch (error) {
      console.error('Error fetching public flight data:', error);
      throw error;
    }
  }

  /**
   * Generate share URL
   */
  generateShareUrl(slug: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/s/${slug}`;
  }
}

export const shareCardService = new ShareCardService();
