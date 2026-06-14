import { functions } from '@/lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import type {
  CheckoutSessionResponse,
  SubscriptionStatusResponse,
  CreateCheckoutRequest,
  CancelSubscriptionRequest
} from '@/types/subscription';

const DODO_FUNCTION_ID = import.meta.env.VITE_APPWRITE_DODO_FUNCTION_ID || 'dodo-payments-handler';

export const apiClient = {
  /**
   * Create a checkout session for subscription payment
   */
  async createCheckoutSession(request: CreateCheckoutRequest): Promise<CheckoutSessionResponse> {
    try {
      const response = await functions.createExecution(
        DODO_FUNCTION_ID,
        JSON.stringify({
          action: 'create-checkout',
          ...request
        }),
        false,
        '/create-checkout',
        ExecutionMethod.POST
      );

      if (response.responseStatusCode !== 200) {
        throw new Error(response.responseBody || 'Failed to create checkout session');
      }

      return JSON.parse(response.responseBody);
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }
  },

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResponse> {
    try {
      const response = await functions.createExecution(
        DODO_FUNCTION_ID,
        JSON.stringify({
          action: 'subscription-status',
          userId
        }),
        false,
        `/subscription-status/${userId}`,
        ExecutionMethod.GET
      );

      if (response.responseStatusCode !== 200) {
        throw new Error(response.responseBody || 'Failed to fetch subscription status');
      }

      return JSON.parse(response.responseBody);
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      throw new Error(error.message || 'Failed to fetch subscription status');
    }
  },

  /**
   * Get subscription from Dodo API
   */
  async getSubscriptionFromDodo(userId: string): Promise<{ subscription: any | null }> {
    try {
      const response = await functions.createExecution(
        DODO_FUNCTION_ID,
        JSON.stringify({
          action: 'get-subscription',
          userId
        }),
        false,
        `/get-subscription`,
        ExecutionMethod.POST
      );

      if (response.responseStatusCode !== 200) {
        throw new Error(response.responseBody || 'Failed to fetch subscription');
      }

      return JSON.parse(response.responseBody);
    } catch (error: any) {
      console.error('Error fetching subscription from Dodo:', error);
      throw new Error(error.message || 'Failed to fetch subscription');
    }
  },

  /**
   * Cancel a subscription at period end
   */
  async cancelSubscription(request: CancelSubscriptionRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await functions.createExecution(
        DODO_FUNCTION_ID,
        JSON.stringify({
          action: 'cancel-subscription',
          ...request
        }),
        false,
        `/cancel-subscription`,
        ExecutionMethod.POST
      );

      if (response.responseStatusCode !== 200) {
        throw new Error(response.responseBody || 'Failed to cancel subscription');
      }

      return JSON.parse(response.responseBody);
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      throw new Error(error.message || 'Failed to cancel subscription');
    }
  },

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(userId: string, subscriptionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await functions.createExecution(
        DODO_FUNCTION_ID,
        JSON.stringify({
          action: 'reactivate-subscription',
          userId,
          subscriptionId
        }),
        false,
        `/reactivate-subscription`,
        ExecutionMethod.POST
      );

      if (response.responseStatusCode !== 200) {
        throw new Error(response.responseBody || 'Failed to reactivate subscription');
      }

      return JSON.parse(response.responseBody);
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      throw new Error(error.message || 'Failed to reactivate subscription');
    }
  },

  /**
   * Renew an expired subscription
   */
  async renewSubscription(userId: string, customerId: string, productId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await functions.createExecution(
        DODO_FUNCTION_ID,
        JSON.stringify({
          action: 'renew-subscription',
          userId,
          customerId,
          productId
        }),
        false,
        `/renew-subscription`,
        ExecutionMethod.POST
      );

      if (response.responseStatusCode !== 200) {
        throw new Error(response.responseBody || 'Failed to renew subscription');
      }

      return JSON.parse(response.responseBody);
    } catch (error: any) {
      console.error('Error renewing subscription:', error);
      throw new Error(error.message || 'Failed to renew subscription');
    }
  },

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const response = await functions.createExecution(
        DODO_FUNCTION_ID,
        JSON.stringify({
          action: 'get-payment-history',
          userId
        }),
        false,
        `/get-payment-history`,
        ExecutionMethod.POST
      );

      if (response.responseStatusCode !== 200) {
        throw new Error(response.responseBody || 'Failed to fetch payment history');
      }

      const data = JSON.parse(response.responseBody);
      return data.payments || [];
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw new Error(error.message || 'Failed to fetch payment history');
    }
  },

  /**
   * Get invoice PDF for a payment
   */
  async getInvoice(paymentId: string): Promise<Blob> {
    try {
      const response = await functions.createExecution(
        DODO_FUNCTION_ID,
        JSON.stringify({
          action: 'get-invoice',
          paymentId
        }),
        false,
        `/get-invoice/${paymentId}`,
        ExecutionMethod.POST
      );

      if (response.responseStatusCode !== 200) {
        throw new Error('Failed to fetch invoice');
      }

      // The response should contain base64 encoded PDF
      const data = JSON.parse(response.responseBody);
      
      if (data.pdf) {
        // Convert base64 to blob
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: 'application/pdf' });
      }

      throw new Error('Invalid invoice response');
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      throw new Error(error.message || 'Failed to fetch invoice');
    }
  }
};

