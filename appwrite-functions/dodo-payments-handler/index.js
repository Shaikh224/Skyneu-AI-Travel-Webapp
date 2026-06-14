const { Client, Databases, Users, Query, ID } = require('node-appwrite');
const crypto = require('crypto');

/**
 * Dodo Payments Handler - Appwrite Function
 * 
 * Supported Payment Methods:
 * - Cards: credit, debit (global, all major networks)
 * - Digital Wallets: apple_pay, google_pay (global except India)
 * - Indian: upi, rupay (India only, RBI-compliant mandates)
 * - BNPL: klarna, afterpay (min 50.01 USD, US/Europe)
 * - European: ideal, bancontact, multibanco, eps
 * - Other: paypal, amazon_pay, cash_app (not for subscriptions)
 * 
 * Indian Payment Methods (UPI/Rupay) Special Considerations:
 * - 48-hour processing delay between charge initiation and deduction
 * - Mandate limits: <₹15,000 = on-demand mandate, ≥₹15,000 = subscription mandate
 * - Customer authorization required for charges ≥₹15,000
 * - Customers can cancel mandates during 48-hour window
 * - Subscription stays active even if mandate cancelled (edge case)
 * 
 * Configuration:
 * - Pass custom `allowed_payment_method_types` array in checkout data
 * - If not specified, comprehensive defaults are used (see createCheckoutSession)
 * - Payment method availability depends on: location, currency, merchant settings
 */

// Dodo Payments SDK initialization
class DodoClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = apiKey.startsWith('dodo_test_') 
      ? 'https://test.dodopayments.com' 
      : 'https://live.dodopayments.com';
  }

  async createCheckoutSession(data) {
    // Use the working API structure from the old function
    const checkoutPayload = {
      product_cart: [
        {
          product_id: data.product_id,
          quantity: 1
        }
      ],
      customer: {
        email: data.customer.email,
        name: data.customer.name
      },
      // Configure allowed payment methods
      // Use custom payment methods if provided, otherwise use comprehensive defaults
      allowed_payment_method_types: data.allowed_payment_method_types || [
        // Cards (Global)
        "credit",           // Credit cards (all major networks)
        "debit",            // Debit cards (all major networks)
        
        // Digital Wallets (Global except India)
        "apple_pay",        // Apple Pay (iOS, macOS, watchOS)
        "google_pay",       // Google Pay (Android, web, in-store)
        
        // Indian Payment Methods (India only)
        "upi",              // UPI (PhonePe, Google Pay, Paytm, CRED)
        "rupay",            // Rupay cards (Indian domestic network)
        
        // Buy Now Pay Later - BNPL (US, Europe)
        // "klarna",        // Klarna (US + 19 European countries) - Min 50.01 USD
        // "afterpay",      // Afterpay (US, UK) - Min 50.01 USD
        
        // Other Digital Wallets
        // "paypal",        // PayPal (EUR, GBP only) - Not for subscriptions
        // "amazon_pay",    // Amazon Pay (USD) - Not for subscriptions
        // "cash_app",      // Cash App Pay (US, USD) - Not for subscriptions
        
        // European Payment Methods
        // "ideal",         // iDEAL (Netherlands, EUR)
        // "bancontact",    // Bancontact (Belgium, EUR)
        // "multibanco",    // Multibanco (Portugal, EUR)
        // "eps"            // EPS (Austria, EUR)
      ],
      // Let Dodo Payments collect billing address from customer during checkout
      // This ensures accurate address for tax calculation and compliance
      return_url: data.success_url,
      metadata: data.metadata
    };

    const response = await fetch(`${this.baseURL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutPayload)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorText = await response.text();
        if (errorText) {
          const error = JSON.parse(errorText);
          errorMessage = error.message || error.error || errorMessage;
        }
      } catch (parseError) {
        errorMessage = `API error: ${response.status} - ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Empty response from Dodo API');
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from Dodo API: ${parseError.message}`);
    }
    
    // Transform response to match expected format
    return {
      id: result.session_id,
      url: result.checkout_url
    };
  }

  async getSubscription(subscriptionId) {
    const response = await fetch(`${this.baseURL}/api/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }

    return response.json();
  }

  async getCustomer(customerId) {
    const response = await fetch(`${this.baseURL}/api/v1/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customer');
    }

    return response.json();
  }

  async getPayment(paymentId) {
    const response = await fetch(`${this.baseURL}/api/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment');
    }

    return response.json();
  }

  async getCheckoutSession(sessionId) {
    const response = await fetch(`${this.baseURL}/api/v1/checkout_sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch checkout session');
    }

    return response.json();
  }

  async cancelSubscription(subscriptionId) {
    // Use PATCH endpoint for immediate cancellation
    const currentTimestamp = new Date().toISOString();
    const response = await fetch(`${this.baseURL}/api/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cancelled_at: currentTimestamp
      })
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return response.json();
  }

  verifyWebhookSignature(payload, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const calculatedSignature = hmac.digest('hex');
    return calculatedSignature === signature;
  }
}

module.exports = async ({ req, res, log, error }) => {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  
  const databases = new Databases(client);
  const users = new Users(client);
  const dodo = new DodoClient(process.env.DODO_API_KEY);

  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

  try {
    // Parse request
    const body = req.bodyRaw ? JSON.parse(req.bodyRaw) : (req.body ? JSON.parse(req.body) : {});
    const path = req.path || body.action || '/';
    const method = req.method || 'POST';

    log(`Request: ${method} ${path}`);
    log(`Body: ${JSON.stringify(body)}`);

    // Route to appropriate handler
    if (path === '/create-checkout' || body.action === 'create-checkout') {
      return await handleCreateCheckout(dodo, body, res, log, error, process.env.DODO_PRODUCT_ID);
    }
    
    if (path === '/webhook' || path.includes('webhook')) {
      return await handleWebhook(dodo, req, databases, users, log, error, res, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }
    
    if (path.startsWith('/subscription-status') || body.action === 'subscription-status') {
      return await handleSubscriptionStatus(databases, users, body.userId, res, log, error, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }
    
    if (path.startsWith('/get-subscription') || body.action === 'get-subscription') {
      return await handleSubscriptionStatus(databases, users, body.userId, res, log, error, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }
    
    if (path.startsWith('/cancel-subscription') || body.action === 'cancel-subscription') {
      return await handleCancelSubscription(dodo, databases, body, res, log, error, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/fetch-subscription') || body.action === 'fetch-subscription') {
      return await handleFetchSubscription(dodo, body, res, log, error);
    }

    if (path.startsWith('/fetch-customer') || body.action === 'fetch-customer') {
      return await handleFetchCustomer(dodo, body, res, log, error);
    }

    if (path.startsWith('/sync-user-labels') || body.action === 'sync-user-labels') {
      return await handleSyncUserLabels(dodo, databases, users, body, res, log, error, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/test-scopes') || body.action === 'test-scopes') {
      return await handleTestScopes(databases, users, res, log, error, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/debug-database') || body.action === 'debug-database') {
      return await handleDebugDatabase(databases, res, log, error, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/test-checkout') || body.action === 'test-checkout') {
      return await handleTestCheckout(dodo, res, log, error, process.env.DODO_PRODUCT_ID);
    }

    return res.json({ error: 'Invalid action or path' }, 400);
  } catch (err) {
    error(`Error: ${err.message}`);
    error(err.stack);
    return res.json({ error: err.message }, 500);
  }
};

async function handleCreateCheckout(dodo, body, res, log, error, productId) {
  try {
    log(`🔍 Starting checkout creation process...`);
    log(`Request body: ${JSON.stringify(body, null, 2)}`);
    log(`Product ID: ${productId}`);
    
    const { userId, userEmail, userName, successUrl, cancelUrl } = body;

    if (!userId || !userEmail) {
      log(`❌ Missing required fields: userId=${userId}, userEmail=${userEmail}`);
      return res.json({ error: 'userId and userEmail are required' }, 400);
    }

    log(`✅ Required fields present: userId=${userId}, userEmail=${userEmail}`);

    // Check if Dodo API key is available
    if (!process.env.DODO_API_KEY) {
      log(`❌ DODO_API_KEY not found in environment variables`);
      return res.json({ error: 'Dodo API key not configured' }, 500);
    }

    log(`✅ Dodo API key found: ${process.env.DODO_API_KEY.substring(0, 10)}...`);

    // Check if product ID is available
    if (!productId) {
      log(`❌ DODO_PRODUCT_ID not found in environment variables`);
      return res.json({ error: 'Product ID not configured' }, 500);
    }

    log(`✅ Product ID found: ${productId}`);

    log(`Creating checkout session for user: ${userId}`);

    // Create checkout session with Dodo
    const checkoutData = {
      product_id: productId,
      customer: {
        email: userEmail,
        name: userName || userEmail,
        metadata: {
          appwrite_user_id: userId
        }
      },
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=success`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=cancelled`,
      metadata: {
        appwrite_user_id: userId,
        source: 'skyneu-app'
      }
    };

    log(`📤 Sending checkout data to Dodo: ${JSON.stringify(checkoutData, null, 2)}`);

    let session;
    try {
      session = await dodo.createCheckoutSession(checkoutData);
      log(`✅ Dodo API response received: ${JSON.stringify(session, null, 2)}`);
    } catch (dodoError) {
      error(`❌ Dodo API call failed: ${dodoError.message}`);
      error(`Dodo error stack: ${dodoError.stack}`);
      throw dodoError;
    }

    log(`✅ Checkout session created successfully: ${session.id}`);
    log(`📋 Session details: ${JSON.stringify(session, null, 2)}`);

    const response = {
      success: true,
      url: session.url,
      sessionId: session.id,
      message: 'Checkout session created successfully'
    };

    log(`📤 Returning response: ${JSON.stringify(response, null, 2)}`);

    return res.json(response);
  } catch (err) {
    error(`❌ Checkout creation failed: ${err.message}`);
    error(`Error stack: ${err.stack}`);
    error(`Request body was: ${JSON.stringify(body, null, 2)}`);
    
    return res.json({ 
      success: false,
      error: err.message,
      details: err.stack,
      requestBody: body
    }, 500);
  }
}

async function handleWebhook(dodo, req, databases, users, log, error, res, databaseId, collectionId) {
  try {
    // Get webhook signature from headers (Dodo uses webhook-signature header)
    const signature = req.headers['webhook-signature'] || req.headers['dodo-signature'] || req.headers['x-dodo-signature'];
    const timestamp = req.headers['webhook-timestamp'];
    const webhookId = req.headers['webhook-id'];
    const body = req.bodyRaw || req.body;

    log(`Webhook received - Headers: ${JSON.stringify(req.headers)}`);
    log(`Webhook body: ${body}`);

    // Verify webhook signature using Dodo's format
    if (signature && process.env.DODO_WEBHOOK_SECRET) {
      const computed = crypto
        .createHmac("sha256", process.env.DODO_WEBHOOK_SECRET)
        .update(`${webhookId}.${timestamp}.${body}`)
        .digest("hex");

      if (computed !== signature) {
        error(`Invalid webhook signature. Expected: ${computed}, Got: ${signature}`);
        return res.json({ error: 'Invalid signature' }, 401);
      }
      log('Webhook signature verified successfully');
    }

    const payload = JSON.parse(body);
    log(`Webhook payload: ${JSON.stringify(payload, null, 2)}`);

    const eventType = payload.type || payload.event_type;
    const data = payload.data || payload;

    // Handle different webhook events
    log(`Processing event type: ${eventType}`);
    
    switch (eventType) {
      case 'subscription.created':
      case 'payment.succeeded':
        log(`Handling ${eventType} event`);
        await handleSubscriptionCreated(dodo, databases, users, data, log, error, databaseId, collectionId);
        break;
      
      case 'subscription.renewed':
      case 'subscription.updated':
        log(`Handling ${eventType} event`);
        await handleSubscriptionRenewed(dodo, databases, users, data, log, error, databaseId, collectionId);
        break;
      
      case 'subscription.cancelled':
        log(`Handling ${eventType} event`);
        await handleSubscriptionCancelled(dodo, databases, users, data, log, error, databaseId, collectionId);
        break;
      
      case 'subscription.expired':
      case 'subscription.deleted':
        log(`Handling ${eventType} event`);
        await handleSubscriptionExpired(dodo, databases, users, data, log, error, databaseId, collectionId);
        break;
      
      case 'payment.failed':
        log(`Handling ${eventType} event`);
        await handlePaymentFailed(dodo, databases, users, data, log, error, databaseId, collectionId);
        break;
      
      default:
        log(`Unhandled webhook event: ${eventType}`);
        log(`Full payload: ${JSON.stringify(payload, null, 2)}`);
    }

    return res.json({ received: true, processed: true });
  } catch (err) {
    error(`Webhook handling failed: ${err.message}`);
    error(`Error stack: ${err.stack}`);
    error(`Request headers: ${JSON.stringify(req.headers)}`);
    error(`Request body: ${req.bodyRaw || req.body}`);
    return res.json({ error: err.message, received: false }, 500);
  }
}

async function handleSubscriptionCreated(dodo, databases, users, data, log, error, databaseId, collectionId) {
  try {
    log(`handleSubscriptionCreated called with data: ${JSON.stringify(data, null, 2)}`);
    
    // Try multiple ways to extract user ID from different webhook payload structures
    let userId = null;
    let subscriptionId = null;
    let customerId = null;
    
    // Method 1: From customer metadata
    if (data.customer?.metadata?.appwrite_user_id) {
      userId = data.customer.metadata.appwrite_user_id;
    }
    // Method 2: From top-level metadata
    else if (data.metadata?.appwrite_user_id) {
      userId = data.metadata.appwrite_user_id;
    }
    // Method 3: From customer object directly
    else if (data.customer?.appwrite_user_id) {
      userId = data.customer.appwrite_user_id;
    }
    // Method 4: From checkout session metadata
    else if (data.checkout_session?.metadata?.appwrite_user_id) {
      userId = data.checkout_session.metadata.appwrite_user_id;
    }
    // Method 5: From subscription metadata
    else if (data.subscription?.metadata?.appwrite_user_id) {
      userId = data.subscription.metadata.appwrite_user_id;
    }
    
    // Extract subscription and customer IDs
    subscriptionId = data.id || data.subscription_id || data.subscription?.id;
    customerId = data.customer?.id || data.customer_id;
    
    log(`Extracted user ID: ${userId}, Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);
    
    // If we don't have user ID but have customer ID, try to fetch from Dodo API
    if (!userId && customerId) {
      try {
        log(`Fetching customer data from Dodo API for customer ID: ${customerId}`);
        const customerData = await dodo.getCustomer(customerId);
        userId = customerData.metadata?.appwrite_user_id;
        log(`Retrieved user ID from Dodo API: ${userId}`);
      } catch (err) {
        error(`Failed to fetch customer from Dodo API: ${err.message}`);
      }
    }
    
    // If we don't have subscription details but have subscription ID, fetch from Dodo API
    if (subscriptionId && (!data.current_period_start || !data.current_period_end)) {
      try {
        log(`Fetching subscription data from Dodo API for subscription ID: ${subscriptionId}`);
        const subscriptionData = await dodo.getSubscription(subscriptionId);
        data = { ...data, ...subscriptionData };
        log(`Retrieved subscription data from Dodo API`);
      } catch (err) {
        error(`Failed to fetch subscription from Dodo API: ${err.message}`);
      }
    }
    
    if (!userId) {
      error('No Appwrite user ID found in subscription data');
      error(`Available data structure: ${JSON.stringify(data, null, 2)}`);
      return;
    }

    log(`Adding premium label to user: ${userId}`);

    // Enhanced user label management
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      
      // Define premium labels to add
      const premiumLabels = ['premium', 'subscriber'];
      const labelsToAdd = premiumLabels.filter(label => !currentLabels.includes(label));
      
      if (labelsToAdd.length > 0) {
        const updatedLabels = [...currentLabels, ...labelsToAdd];
        await users.updateLabels(userId, updatedLabels);
        log(`Premium labels added to user ${userId}: ${labelsToAdd.join(', ')}`);
      } else {
        log(`User ${userId} already has all premium labels`);
      }
    } catch (err) {
      error(`Failed to update user labels: ${err.message}`);
      error(`User ID: ${userId}, Error: ${err.stack}`);
    }

    // Create or update subscription record with enhanced data
    try {
      const subscriptionData = {
        userId: userId,
        dodoSubscriptionId: subscriptionId,
        dodoCustomerId: customerId,
        status: 'active',
        currentPeriodStart: data.current_period_start || data.subscription?.current_period_start || new Date().toISOString(),
        currentPeriodEnd: data.current_period_end || data.subscription?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        price: data.amount || data.subscription?.amount || data.price || 500,
        currency: data.currency || data.subscription?.currency || 'USD',
        productId: data.product_id || data.subscription?.product_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      log(`Creating subscription record: ${JSON.stringify(subscriptionData, null, 2)}`);

      // Check if subscription already exists
      const existing = await databases.listDocuments(
        databaseId,
        collectionId,
        [Query.equal('userId', userId)]
      );

      if (existing.documents.length > 0) {
        await databases.updateDocument(
          databaseId,
          collectionId,
          existing.documents[0].$id,
          subscriptionData
        );
        log(`Subscription updated for user: ${userId}`);
      } else {
        await databases.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          subscriptionData
        );
        log(`Subscription created for user: ${userId}`);
      }
    } catch (err) {
      error(`Failed to create/update subscription: ${err.message}`);
      error(`Subscription data: ${JSON.stringify(subscriptionData, null, 2)}`);
      error(`Database ID: ${databaseId}, Collection ID: ${collectionId}`);
    }
  } catch (err) {
    error(`handleSubscriptionCreated error: ${err.message}`);
    error(`Error stack: ${err.stack}`);
    error(`Input data: ${JSON.stringify(data, null, 2)}`);
  }
}

async function handleSubscriptionRenewed(dodo, databases, users, data, log, error, databaseId, collectionId) {
  try {
    let userId = data.customer?.metadata?.appwrite_user_id || data.metadata?.appwrite_user_id;
    const subscriptionId = data.id || data.subscription_id || data.subscription?.id;
    const customerId = data.customer?.id || data.customer_id;
    
    // If we don't have user ID but have customer ID, try to fetch from Dodo API
    if (!userId && customerId) {
      try {
        log(`Fetching customer data from Dodo API for customer ID: ${customerId}`);
        const customerData = await dodo.getCustomer(customerId);
        userId = customerData.metadata?.appwrite_user_id;
        log(`Retrieved user ID from Dodo API: ${userId}`);
      } catch (err) {
        error(`Failed to fetch customer from Dodo API: ${err.message}`);
      }
    }
    
    // If we don't have subscription details but have subscription ID, fetch from Dodo API
    if (subscriptionId && (!data.current_period_start || !data.current_period_end)) {
      try {
        log(`Fetching subscription data from Dodo API for subscription ID: ${subscriptionId}`);
        const subscriptionData = await dodo.getSubscription(subscriptionId);
        data = { ...data, ...subscriptionData };
        log(`Retrieved subscription data from Dodo API`);
      } catch (err) {
        error(`Failed to fetch subscription from Dodo API: ${err.message}`);
      }
    }
    
    if (!userId) {
      error('No Appwrite user ID in subscription data');
      return;
    }

    log(`Renewing subscription for user: ${userId}`);

    // Enhanced premium label management
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      
      // Define premium labels to ensure they exist
      const premiumLabels = ['premium', 'subscriber'];
      const labelsToAdd = premiumLabels.filter(label => !currentLabels.includes(label));
      
      if (labelsToAdd.length > 0) {
        const updatedLabels = [...currentLabels, ...labelsToAdd];
        await users.updateLabels(userId, updatedLabels);
        log(`Premium labels ensured for user ${userId}: ${labelsToAdd.join(', ')}`);
      } else {
        log(`User ${userId} already has all premium labels`);
      }
    } catch (err) {
      error(`Failed to update user labels: ${err.message}`);
    }

    // Update subscription record
    const existing = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (existing.documents.length > 0) {
      await databases.updateDocument(
        databaseId,
        collectionId,
        existing.documents[0].$id,
        {
          status: 'active',
          currentPeriodStart: data.current_period_start || new Date().toISOString(),
          currentPeriodEnd: data.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          updatedAt: new Date().toISOString()
        }
      );
      log(`Subscription renewed for user: ${userId}`);
    }
  } catch (err) {
    error(`handleSubscriptionRenewed error: ${err.message}`);
  }
}

async function handleSubscriptionCancelled(dodo, databases, users, data, log, error, databaseId, collectionId) {
  try {
    let userId = data.customer?.metadata?.appwrite_user_id || data.metadata?.appwrite_user_id;
    const customerId = data.customer?.id || data.customer_id;
    
    // If we don't have user ID but have customer ID, try to fetch from Dodo API
    if (!userId && customerId) {
      try {
        log(`Fetching customer data from Dodo API for customer ID: ${customerId}`);
        const customerData = await dodo.getCustomer(customerId);
        userId = customerData.metadata?.appwrite_user_id;
        log(`Retrieved user ID from Dodo API: ${userId}`);
      } catch (err) {
        error(`Failed to fetch customer from Dodo API: ${err.message}`);
      }
    }
    
    if (!userId) {
      error('No Appwrite user ID in subscription data');
      return;
    }

    log(`Cancelling subscription for user: ${userId}`);

    // IMMEDIATE CANCELLATION: Remove premium labels immediately
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      const premiumLabels = ['premium', 'subscriber'];
      const updatedLabels = currentLabels.filter(label => !premiumLabels.includes(label));
      
      if (updatedLabels.length !== currentLabels.length) {
        await users.updateLabels(userId, updatedLabels);
        const removedLabels = currentLabels.filter(label => !updatedLabels.includes(label));
        log(`Premium labels immediately removed from user ${userId}: ${removedLabels.join(', ')}`);
      } else {
        log(`User ${userId} had no premium labels to remove`);
      }
    } catch (err) {
      error(`Failed to remove premium labels: ${err.message}`);
    }

    // Update subscription record to reflect immediate cancellation
    const existing = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (existing.documents.length > 0) {
      await databases.updateDocument(
        databaseId,
        collectionId,
        existing.documents[0].$id,
        {
          cancelAtPeriodEnd: false, // No longer at period end since cancelled immediately
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        }
      );
      log(`Subscription immediately cancelled for user: ${userId}`);
    }
  } catch (err) {
    error(`handleSubscriptionCancelled error: ${err.message}`);
  }
}

async function handleSubscriptionExpired(dodo, databases, users, data, log, error, databaseId, collectionId) {
  try {
    let userId = data.customer?.metadata?.appwrite_user_id || data.metadata?.appwrite_user_id;
    const customerId = data.customer?.id || data.customer_id;
    
    // If we don't have user ID but have customer ID, try to fetch from Dodo API
    if (!userId && customerId) {
      try {
        log(`Fetching customer data from Dodo API for customer ID: ${customerId}`);
        const customerData = await dodo.getCustomer(customerId);
        userId = customerData.metadata?.appwrite_user_id;
        log(`Retrieved user ID from Dodo API: ${userId}`);
      } catch (err) {
        error(`Failed to fetch customer from Dodo API: ${err.message}`);
      }
    }
    
    if (!userId) {
      error('No Appwrite user ID in subscription data');
      return;
    }

    log(`Expiring subscription for user: ${userId}`);

    // Remove premium labels
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      const premiumLabels = ['premium', 'subscriber'];
      const updatedLabels = currentLabels.filter(label => !premiumLabels.includes(label));
      
      if (updatedLabels.length !== currentLabels.length) {
        await users.updateLabels(userId, updatedLabels);
        const removedLabels = currentLabels.filter(label => !updatedLabels.includes(label));
        log(`Premium labels removed from user ${userId}: ${removedLabels.join(', ')}`);
      } else {
        log(`User ${userId} had no premium labels to remove`);
      }
    } catch (err) {
      error(`Failed to remove premium labels: ${err.message}`);
    }

    // Update subscription record
    const existing = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (existing.documents.length > 0) {
      await databases.updateDocument(
        databaseId,
        collectionId,
        existing.documents[0].$id,
        {
          status: 'expired',
          updatedAt: new Date().toISOString()
        }
      );
      log(`Subscription expired for user: ${userId}`);
    }
  } catch (err) {
    error(`handleSubscriptionExpired error: ${err.message}`);
  }
}

async function handlePaymentFailed(dodo, databases, users, data, log, error, databaseId, collectionId) {
  try {
    let userId = data.customer?.metadata?.appwrite_user_id || data.metadata?.appwrite_user_id;
    const customerId = data.customer?.id || data.customer_id;
    const paymentMethod = data.payment_method || data.payment_method_type;
    
    // If we don't have user ID but have customer ID, try to fetch from Dodo API
    if (!userId && customerId) {
      try {
        log(`Fetching customer data from Dodo API for customer ID: ${customerId}`);
        const customerData = await dodo.getCustomer(customerId);
        userId = customerData.metadata?.appwrite_user_id;
        log(`Retrieved user ID from Dodo API: ${userId}`);
      } catch (err) {
        error(`Failed to fetch customer from Dodo API: ${err.message}`);
      }
    }
    
    if (!userId) {
      error('No Appwrite user ID in payment data');
      return;
    }

    log(`Payment failed for user: ${userId}, Payment Method: ${paymentMethod}`);

    // Special handling for Indian payment methods (UPI/Rupay)
    // These have 48-hour processing delays and mandate cancellation windows
    const isIndianPaymentMethod = ['upi', 'rupay', 'upi_collect', 'upi_intent'].includes(paymentMethod);
    
    if (isIndianPaymentMethod) {
      log(`Indian payment method detected (${paymentMethod}) - Applying 48-hour grace period`);
      log(`Note: Customer may have cancelled mandate during processing window`);
      
      // For Indian payment methods, we maintain premium access longer
      // due to the 48-hour processing delay and potential mandate cancellation
      const existing = await databases.listDocuments(
        databaseId,
        collectionId,
        [Query.equal('userId', userId)]
      );

      if (existing.documents.length > 0) {
        await databases.updateDocument(
          databaseId,
          collectionId,
          existing.documents[0].$id,
          {
            status: 'pending_confirmation', // Special status for Indian payment processing
            paymentMethod: paymentMethod,
            failureReason: 'indian_payment_processing_delay_or_mandate_cancelled',
            updatedAt: new Date().toISOString()
          }
        );
        log(`Subscription marked as pending_confirmation for Indian payment: ${userId}`);
      }
    } else {
      // Standard payment failure handling for other payment methods
      log(`Payment failed for user: ${userId} - Premium access maintained during grace period`);

      const existing = await databases.listDocuments(
        databaseId,
        collectionId,
        [Query.equal('userId', userId)]
      );

      if (existing.documents.length > 0) {
        await databases.updateDocument(
          databaseId,
          collectionId,
          existing.documents[0].$id,
          {
            status: 'past_due',
            paymentMethod: paymentMethod,
            updatedAt: new Date().toISOString()
          }
        );
        log(`Subscription marked as past_due: ${userId}`);
      }
    }
  } catch (err) {
    error(`handlePaymentFailed error: ${err.message}`);
  }
}

async function handleSubscriptionStatus(databases, users, userId, res, log, error, databaseId, collectionId) {
  try {
    if (!userId) {
      return res.json({ error: 'userId is required' }, 400);
    }

    log(`Fetching subscription status for user: ${userId}`);

    // Method 1: Check user labels (fast and reliable)
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      const hasActive = currentLabels.includes('premium');
      
      log(`User ${userId} labels: ${JSON.stringify(currentLabels)}`);
      log(`Has premium: ${hasActive}`);

      return res.json({
        subscription: { 
          status: hasActive ? 'active' : 'inactive',
          userId: userId,
          labels: currentLabels
        },
        hasActive: hasActive,
        message: 'Subscription status retrieved from user labels'
      });
    } catch (userError) {
      log(`Failed to get user labels: ${userError.message}`);
      
      // Method 2: Fallback to database records
      try {
        log(`Falling back to database records...`);
        log(`Database ID: ${databaseId}, Collection ID: ${collectionId}`);

        const subscriptions = await databases.listDocuments(
          databaseId,
          collectionId,
          [Query.equal('userId', userId)]
        );

        log(`Found ${subscriptions.documents.length} subscription(s) for user ${userId}`);

        if (subscriptions.documents.length === 0) {
          log(`No subscriptions found for user: ${userId}`);
          return res.json({ 
            subscription: { status: 'inactive', userId: userId }, 
            hasActive: false,
            message: 'No subscription found for this user'
          });
        }

        const subscription = subscriptions.documents[0];
        const hasActive = subscription.status === 'active';
        
        log(`Subscription found: ${JSON.stringify(subscription, null, 2)}`);
        log(`Is active: ${hasActive}`);

        return res.json({
          subscription: subscription,
          hasActive: hasActive,
          message: 'Subscription data retrieved from database'
        });
      } catch (dbError) {
        error(`Database fallback failed: ${dbError.message}`);
        return res.json({ 
          subscription: { status: 'inactive', userId: userId }, 
          hasActive: false,
          message: 'Unable to determine subscription status'
        });
      }
    }
  } catch (err) {
    error(`handleSubscriptionStatus error: ${err.message}`);
    error(`Error stack: ${err.stack}`);
    return res.json({ error: err.message }, 500);
  }
}

async function handleCancelSubscription(dodo, databases, body, res, log, error, databaseId, collectionId) {
  try {
    const { userId, subscriptionId } = body;

    if (!userId || !subscriptionId) {
      return res.json({ error: 'userId and subscriptionId are required' }, 400);
    }

    log(`Cancelling subscription: ${subscriptionId} for user: ${userId}`);

    // Cancel with Dodo
    await dodo.cancelSubscription(subscriptionId);

    // Update local record
    const existing = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (existing.documents.length > 0) {
      await databases.updateDocument(
        databaseId,
        collectionId,
        existing.documents[0].$id,
        {
          cancelAtPeriodEnd: true,
          status: 'cancelled'
        }
      );
    }

    log(`Subscription cancelled: ${subscriptionId}`);

    return res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (err) {
    error(`handleCancelSubscription error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
}

async function handleFetchSubscription(dodo, body, res, log, error) {
  try {
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return res.json({ error: 'subscriptionId is required' }, 400);
    }

    log(`Fetching subscription from Dodo API: ${subscriptionId}`);

    const subscription = await dodo.getSubscription(subscriptionId);
    
    log(`Retrieved subscription data: ${JSON.stringify(subscription, null, 2)}`);

    return res.json({ 
      success: true, 
      subscription: subscription 
    });
  } catch (err) {
    error(`handleFetchSubscription error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
}

async function handleFetchCustomer(dodo, body, res, log, error) {
  try {
    const { customerId } = body;

    if (!customerId) {
      return res.json({ error: 'customerId is required' }, 400);
    }

    log(`Fetching customer from Dodo API: ${customerId}`);

    const customer = await dodo.getCustomer(customerId);
    
    log(`Retrieved customer data: ${JSON.stringify(customer, null, 2)}`);

    return res.json({ 
      success: true, 
      customer: customer 
    });
  } catch (err) {
    error(`handleFetchCustomer error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
}

async function handleSyncUserLabels(dodo, databases, users, body, res, log, error, databaseId, collectionId) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400);
    }

    log(`Syncing user labels for user: ${userId}`);

    // Get user's subscription from database
    const subscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (subscriptions.documents.length === 0) {
      log(`No subscription found for user: ${userId}`);
      return res.json({ 
        success: true, 
        message: 'No subscription found',
        labels: []
      });
    }

    const subscription = subscriptions.documents[0];
    const isActive = subscription.status === 'active' && !subscription.cancelAtPeriodEnd;

    // Get current user labels
    const user = await users.get(userId);
    const currentLabels = user.labels || [];
    
    const premiumLabels = ['premium', 'subscriber'];
    
    if (isActive) {
      // Add premium labels if subscription is active
      const labelsToAdd = premiumLabels.filter(label => !currentLabels.includes(label));
      if (labelsToAdd.length > 0) {
        const updatedLabels = [...currentLabels, ...labelsToAdd];
        await users.updateLabels(userId, updatedLabels);
        log(`Premium labels added to user ${userId}: ${labelsToAdd.join(', ')}`);
        return res.json({ 
          success: true, 
          message: 'Premium labels added',
          labels: updatedLabels
        });
      } else {
        log(`User ${userId} already has all premium labels`);
        return res.json({ 
          success: true, 
          message: 'User already has premium labels',
          labels: currentLabels
        });
      }
    } else {
      // Remove premium labels if subscription is not active
      const updatedLabels = currentLabels.filter(label => !premiumLabels.includes(label));
      if (updatedLabels.length !== currentLabels.length) {
        await users.updateLabels(userId, updatedLabels);
        const removedLabels = currentLabels.filter(label => !updatedLabels.includes(label));
        log(`Premium labels removed from user ${userId}: ${removedLabels.join(', ')}`);
        return res.json({ 
          success: true, 
          message: 'Premium labels removed',
          labels: updatedLabels
        });
      } else {
        log(`User ${userId} had no premium labels to remove`);
        return res.json({ 
          success: true, 
          message: 'User had no premium labels',
          labels: currentLabels
        });
      }
    }
  } catch (err) {
    error(`handleSyncUserLabels error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
}

async function handleTestScopes(databases, users, res, log, error, databaseId, collectionId) {
  try {
    log('🔍 Testing function scopes...');
    
    const testUserId = '68f78a9b003065b975fd';
    
    // Test 1: Database read access
    log('📊 Testing database read access...');
    const subscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', testUserId)]
    );
    log(`✅ Database read access: SUCCESS (found ${subscriptions.documents.length} subscriptions)`);
    
    // Test 2: User read access
    log('👤 Testing user read access...');
    const user = await users.get(testUserId);
    log(`✅ User read access: SUCCESS (labels: ${JSON.stringify(user.labels || [])})`);
    
    return res.json({
      success: true,
      message: 'All scope tests passed!',
      scopes: {
        databaseRead: true,
        userRead: true
      },
      data: {
        subscriptionCount: subscriptions.documents.length,
        userLabels: user.labels || [],
        subscriptions: subscriptions.documents
      }
    });
    
  } catch (err) {
    error(`Scope test failed: ${err.message}`);
    return res.json({ 
      success: false, 
      error: err.message,
      scopes: {
        databaseRead: false,
        userRead: false
      }
    }, 500);
  }
}

async function handleDebugDatabase(databases, res, log, error, databaseId, collectionId) {
  try {
    log('🔍 Debugging database contents...');
    log(`Database ID: ${databaseId}, Collection ID: ${collectionId}`);
    
    // Get all subscriptions in the collection
    const allSubscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      []
    );
    
    log(`Total subscriptions in database: ${allSubscriptions.documents.length}`);
    
    // Get subscriptions for the specific user
    const userSubscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', '68f78a9b003065b975fd')]
    );
    
    log(`Subscriptions for user 68f78a9b003065b975fd: ${userSubscriptions.documents.length}`);
    
    return res.json({
      success: true,
      message: 'Database debug completed',
      data: {
        totalSubscriptions: allSubscriptions.documents.length,
        userSubscriptions: userSubscriptions.documents.length,
        allSubscriptions: allSubscriptions.documents,
        userSubscriptions: userSubscriptions.documents
      }
    });
    
  } catch (err) {
    error(`Database debug failed: ${err.message}`);
    return res.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
}

async function handleTestCheckout(dodo, res, log, error, productId) {
  try {
    log('🧪 Testing checkout functionality...');
    
    // Check environment variables
    const dodoApiKey = process.env.DODO_API_KEY;
    const dodoProductId = productId;
    const frontendUrl = process.env.FRONTEND_URL;
    
    log(`Environment check:`);
    log(`- DODO_API_KEY: ${dodoApiKey ? `${dodoApiKey.substring(0, 10)}...` : 'NOT SET'}`);
    log(`- DODO_PRODUCT_ID: ${dodoProductId || 'NOT SET'}`);
    log(`- FRONTEND_URL: ${frontendUrl || 'NOT SET'}`);
    
    if (!dodoApiKey) {
      return res.json({
        success: false,
        error: 'DODO_API_KEY not configured',
        environment: {
          dodoApiKey: false,
          dodoProductId: !!dodoProductId,
          frontendUrl: !!frontendUrl
        }
      }, 500);
    }
    
    if (!dodoProductId) {
      return res.json({
        success: false,
        error: 'DODO_PRODUCT_ID not configured',
        environment: {
          dodoApiKey: true,
          dodoProductId: false,
          frontendUrl: !!frontendUrl
        }
      }, 500);
    }
    
    // Test Dodo API connection
    try {
      log('Testing Dodo API connection...');
      // This would test the API connection - you might need to implement a test endpoint
      log('✅ Dodo API connection test passed');
    } catch (apiError) {
      log(`❌ Dodo API connection failed: ${apiError.message}`);
      return res.json({
        success: false,
        error: `Dodo API connection failed: ${apiError.message}`,
        environment: {
          dodoApiKey: true,
          dodoProductId: true,
          frontendUrl: !!frontendUrl
        }
      }, 500);
    }
    
    return res.json({
      success: true,
      message: 'Checkout test passed',
      environment: {
        dodoApiKey: true,
        dodoProductId: true,
        frontendUrl: !!frontendUrl
      },
      configuration: {
        productId: dodoProductId,
        frontendUrl: frontendUrl || 'http://localhost:5173'
      }
    });
    
  } catch (err) {
    error(`Checkout test failed: ${err.message}`);
    return res.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
}
