import { account } from '../lib/appwrite';
import { apiClient } from './apiClient';
import type { Subscription, CreateCheckoutRequest } from '@/types/subscription';

export const subscriptionService = {
  // Create checkout session for subscription
  async createCheckoutSession(userId: string, userEmail: string, userName?: string): Promise<{ url: string; sessionId: string }> {
    const request: CreateCheckoutRequest = {
      userId,
      userEmail,
      userName,
      successUrl: `${window.location.origin}/profile?payment=success`,
      cancelUrl: `${window.location.origin}/profile?payment=cancelled`
    };

    return await apiClient.createCheckoutSession(request);
  },

  // Get subscription details from Dodo API
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const response = await apiClient.getSubscriptionFromDodo(userId);
      return response.subscription;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  },

  // Cancel subscription at period end
  async cancelSubscription(userId: string, subscriptionId: string): Promise<void> {
    await apiClient.cancelSubscription({ userId, subscriptionId });
  },

  // Reactivate subscription
  async reactivateSubscription(userId: string, subscriptionId: string): Promise<void> {
    await apiClient.reactivateSubscription(userId, subscriptionId);
  },

  // Renew expired subscription
  async renewSubscription(userId: string, customerId: string, productId: string): Promise<void> {
    await apiClient.renewSubscription(userId, customerId, productId);
  },

  // Get payment history
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      return await apiClient.getPaymentHistory(userId);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  },

  // Get invoice for a payment
  async getInvoice(paymentId: string): Promise<Blob> {
    return await apiClient.getInvoice(paymentId);
  },

  // Download invoice
  async downloadInvoice(paymentId: string, fileName?: string): Promise<void> {
    try {
      const blob = await this.getInvoice(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `invoice-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  },

  // Get subscription status from API
  async getSubscriptionStatusFromAPI(userId: string): Promise<{
    subscription: Subscription | null;
    hasActive: boolean;
  }> {
    try {
      return await apiClient.getSubscriptionStatus(userId);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return { subscription: null, hasActive: false };
    }
  },

  // Update user subscription via labels (legacy method, kept for backward compatibility)
  async updateSubscription(
    _userId: string, 
    subscription: 'free' | 'premium'
  ): Promise<void> {
    // Note: Appwrite account.get() gets current user, not by userId
    // This method is deprecated - use getSubscription() for subscription status
    if (subscription === 'premium') {
      await account.updatePrefs({ subscription: 'premium' });
    } else {
      await account.updatePrefs({ subscription: 'free' });
    }
  },

  // Get user subscription status from labels
  async getSubscriptionStatus(_userId: string): Promise<{
    subscription: 'free' | 'premium';
    isActive: boolean;
  }> {
    // Get current logged-in user (account.get() doesn't take userId)
    const user = await account.get();
    const prefs = user.prefs as { subscription?: 'free' | 'premium' };
    const subscription = prefs.subscription || 'free';
    
    return {
      subscription,
      isActive: subscription === 'premium'
    };
  },

  // Check if user has premium access (based on labels)
  async hasPremiumAccess(_userId: string): Promise<boolean> {
    const user = await account.get();
    const prefs = user.prefs as { subscription?: 'free' | 'premium' };
    return prefs.subscription === 'premium';
  },

  // Get subscription display info
  getSubscriptionDisplayInfo(subscription: 'free' | 'premium'): {
    name: string;
    color: string;
    features: string[];
  } {
    switch (subscription) {
      case 'free':
        return {
          name: 'Free',
          color: 'gray',
          features: ['View shared trips only', 'Limited features']
        };
      case 'premium':
        return {
          name: 'Premium',
          color: 'blue',
          features: ['All trip features', 'Flight search', 'AI assistant', 'Priority support']
        };
      default:
        return {
          name: 'Free',
          color: 'gray',
          features: ['Basic features']
        };
    }
  }
};
