export interface Subscription {
  subscription_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'on_hold';
  next_billing_date: string;
  previous_billing_date: string;
  expires_at: string;
  recurring_pre_tax_amount: number;
  currency: string;
  payment_frequency_interval: string;
  payment_frequency_count: number;
  subscription_period_count?: number;
  subscription_period_interval?: string;
  cancel_at_next_billing_date: boolean;
  customer: {
    email: string;
    name: string;
    customer_id: string;
    id?: string;  // Allow id as alternative to customer_id
  };
  payment_method?: {
    type?: string;  // e.g., "card", "paypal", etc.
    last4?: string;  // Last 4 digits of card
    brand?: string;  // e.g., "visa", "mastercard"
    exp_month?: number;
    exp_year?: number;
  };
  product_id: string;
  created_at: string;
  
  // Legacy fields for backward compatibility
  $id?: string;
  id?: string;  // Subscription ID alternative
  userId?: string;
  dodoSubscriptionId?: string;
  dodoCustomerId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  cancelAtNextBilling?: boolean;  // Alternative name for cancel_at_next_billing_date
  isCancelled?: boolean;  // Simplified cancellation flag
  price?: number | string;  // Can be either number (cents) or formatted string ("$3.00")
  interval?: string;  // Simplified interval (e.g., "month")
  subscriptionId?: string;  // Alternative to subscription_id
  nextBillingDate?: string;  // Camel case alternative
  billingDate?: string;  // Another date field alternative
  expiresAt?: string;  // Camel case alternative to expires_at
  features?: string[];  // List of subscription features/benefits
  plan?: string;  // Plan name (e.g., "Premium Plan")
  $createdAt?: string;
  $updatedAt?: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface SubscriptionStatusResponse {
  subscription: Subscription | null;
  hasActive: boolean;
}

export interface CreateCheckoutRequest {
  userId: string;
  userEmail: string;
  userName?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CancelSubscriptionRequest {
  userId: string;
  subscriptionId: string;
}

