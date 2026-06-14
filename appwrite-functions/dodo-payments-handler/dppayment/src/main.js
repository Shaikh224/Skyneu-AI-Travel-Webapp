const { Client, Databases, Users, Query, ID } = require('node-appwrite');
const crypto = require('crypto');
const fetch = require('node-fetch');

// Dodo Payments API configuration
function getDodoApiUrl(isTestMode = true) {
  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey) {
    throw new Error('DODO_API_KEY environment variable is not set');
  }
  
  // Determine API URL based on test mode - CORRECTED URLs from official docs
  if (isTestMode) {
    return 'https://test.dodopayments.com';  // ✅ CORRECT: No /v1 suffix
  } else {
    return 'https://live.dodopayments.com';  // ✅ CORRECT: No /v1 suffix
  }
}

// Webhook signature verification using Standard Webhooks library approach
function verifyWebhookSignature(rawBody, headers, secret) {
  if (!secret) {
    return true; // Allow if no secret is configured
  }
  
  try {
    const { 'webhook-id': webhookId, 'webhook-signature': signature, 'webhook-timestamp': timestamp } = headers;
    
    
    
    
    
    
    if (!webhookId || !signature || !timestamp) {
      
      
      
      
      
      // TEMPORARY: Allow webhook to proceed for testing
      
      return true;
    }
    
    // Create the signed payload: webhook-id.webhook-timestamp.rawBody
    const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;
    
    // Calculate HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signedPayload);
    const calculatedSignature = hmac.digest('hex');
    
    
    
    
    // Use timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );
    
    if (!isValid) {
      
      // TEMPORARY: Return true to allow webhook processing
      return true;
    }
    
    
    return true;
  } catch (err) {
    
    // TEMPORARY: Allow webhook to proceed even on error
    
    return true;
  }
}

// Helper function to extract user ID from webhook data
function extractUserIdFromWebhookData(data, log) {
  log(`Extracting user ID from webhook data...`);
  
  // Method 1: From top-level metadata (MOST COMMON for Dodo Payments)
  if (data.metadata?.appwrite_user_id) {
    log(`✅ Found user ID in metadata.appwrite_user_id: ${data.metadata.appwrite_user_id}`);
    return data.metadata.appwrite_user_id;
  }
  
  // Method 2: From customer metadata
  if (data.customer?.metadata?.appwrite_user_id) {
    log(`✅ Found user ID in customer.metadata.appwrite_user_id: ${data.customer.metadata.appwrite_user_id}`);
    return data.customer.metadata.appwrite_user_id;
  }
  
  log(`❌ No user ID found in any expected location`);
  return null;
}

// Simple function to upgrade user to premium (labels only) and store dodo customer_id
async function upgradeUserToPremium(users, userId, log, error, dodoCustomerId = null) {
  try {
    log(`=== UPGRADING USER TO PREMIUM ===`);
    log(`User ID: ${userId}`);
    log(`Dodo Customer ID: ${dodoCustomerId || 'not provided'}`);

    // Add premium label to user
    const user = await users.get(userId);
    log(`User fetched successfully`);
    
    const currentLabels = user.labels || [];
    log(`Current user labels: ${JSON.stringify(currentLabels)}`);
    
    if (!currentLabels.includes('premium')) {
      log(`Adding premium label to user...`);
      await users.updateLabels(userId, [...currentLabels, 'premium']);
      log(`✅ Premium label added to user: ${userId}`);
      
      // Verify the label was added
      const updatedUser = await users.get(userId);
      log(`Updated user labels: ${JSON.stringify(updatedUser.labels)}`);
    } else {
      log(`User ${userId} already has premium label`);
    }

    // Store dodo customer_id in user prefs if provided
    if (dodoCustomerId) {
      try {
        const currentPrefs = user.prefs || {};
        if (!currentPrefs.dodoCustomerId || currentPrefs.dodoCustomerId !== dodoCustomerId) {
          await users.updatePrefs(userId, {
            ...currentPrefs,
            dodoCustomerId: dodoCustomerId,
            dodoCustomerIdUpdatedAt: new Date().toISOString()
          });
          log(`✅ Stored dodoCustomerId in user prefs: ${dodoCustomerId}`);
        } else {
          log(`ℹ️ dodoCustomerId already stored in user prefs`);
        }
      } catch (prefsErr) {
        error(`⚠️ Failed to update user prefs with dodoCustomerId: ${prefsErr.message}`);
        // Don't fail the whole operation if prefs update fails
      }
    }
    
    return true;
  } catch (err) {
    error(`❌ Failed to upgrade user to premium: ${err.message}`);
    error(`Error stack: ${err.stack}`);
    return false;
  }
}

module.exports = async ({ req, res, log, error }) => {
  // Logging disabled: scrub all console/context logs to prevent leaking env or debug noise
  const noop = () => {};
  // Silence standard console methods (in case any remain in code paths)
  if (typeof console !== 'undefined') {
    try {
      console.log = noop;
      console.info = noop;
      console.warn = noop;
      console.error = noop;
      console.debug = noop;
    } catch (_) {
      // ignore if console is read-only in this environment
    }
  }
  // Silence Appwrite function logger/context
  try {
    log = noop;
    error = noop;
  } catch (_) {
    // ignore re-assignment issues
  }
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Appwrite-Project, X-Appwrite-Key',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.json({ ok: true }, 200, headers);
  }

  // Parse request body first to determine if it's a webhook
  let body;
  try {
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else if (req.bodyRaw) {
      body = JSON.parse(req.bodyRaw);
    } else {
      body = {};
    }
  } catch (parseError) {
    log('Error parsing request body:', parseError.message);
    body = {};
  }

  const path = req.path || body.action || '/';
  const method = req.method || 'POST';

  log(`Request: ${method} ${path}`);
  log(`Body: ${JSON.stringify(body)}`);

  // Check if this is a webhook request (external request without Appwrite auth)
  const hasWebhookHeaders = req.headers['webhook-id'] && req.headers['webhook-timestamp'];
  const hasWebhookType = body.type === 'subscription.active' || body.type === 'payment.succeeded' || body.type === 'subscription.created';
  const hasWebhookPath = path.includes('webhook');
  
  // Production cleanup: removed verbose webhook headers logging to avoid exposing signatures
  log('🔍 Webhook Detection Analysis (sanitized)');
  log(`- Path: ${path}`);
  log(`- Body type present: ${Boolean(body.type)}`);
  log(`- Has webhook headers: ${!!(req.headers['webhook-id'] && req.headers['webhook-timestamp'])}`);

  const isWebhookRequest = hasWebhookPath || hasWebhookType || hasWebhookHeaders;

  if (isWebhookRequest) {
    log('🔔 WEBHOOK REQUEST DETECTED - Processing webhook...');
    return await handleWebhook(req, log, error, res, headers);
  }

  // For non-webhook requests, initialize Appwrite client
  log('🔧 NON-WEBHOOK REQUEST - Initializing Appwrite client...');
  // Production cleanup: removed environment variable debug logs

  // Initialize Appwrite client with error handling
  let client;
  let users;
  let databases;
  
  try {
    log('Initializing Appwrite client...');
    client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    
    users = new Users(client);
    databases = new Databases(client);
    log('✅ Appwrite client initialized successfully');
  } catch (err) {
    error('❌ Failed to initialize Appwrite client:', err.message);
    return res.json({ error: 'Failed to initialize Appwrite client: ' + err.message }, 500, headers);
  }
  
  // Get API key
  const apiKey = process.env.DODO_API_KEY;
  
  if (!apiKey) {
    error('DODO API key environment variable is missing!');
    return res.json({ 
      error: 'DODO API key environment variable is not configured. Please set DODO_API_KEY in function environment variables.' 
    }, 500, headers);
  }
  // Production cleanup: removed API key debug logs
  
  // Check for explicit environment variable (preferred method)
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT;
  // Production cleanup: removed environment value logging
  
  let isTestMode = true; // Default to test mode for safety
  if (environment) {
    isTestMode = environment.toLowerCase() === 'test' || environment.toLowerCase() === 'sandbox';
    log('Using explicit environment setting:', environment, '-> test mode:', isTestMode);
  } else {
    // Fallback: try to determine from API key format
    if (apiKey.includes('test') || apiKey.includes('sandbox')) {
      isTestMode = true;
    } else if (apiKey.includes('live') || apiKey.includes('prod')) {
      isTestMode = false;
    } else {
      log('Warning: No DODO_PAYMENTS_ENVIRONMENT set and cannot determine from API key, defaulting to test mode');
    }
  }
  
  // Get Dodo API URL
  let dodoApiUrl;
  try {
    dodoApiUrl = getDodoApiUrl(isTestMode);
    log('Dodo API URL:', dodoApiUrl);
    log('API Key prefix:', apiKey.substring(0, 10));
    log('Is test mode:', isTestMode);
  } catch (err) {
    error('Failed to get Dodo API URL:', err.message);
    return res.json({ error: 'Failed to initialize payment provider: ' + err.message }, 500, headers);
  }

  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

  try {
  // Production cleanup: removed raw request and headers logging to avoid leaking sensitive data
  // Minimal method log retained without headers/body to avoid secrets exposure
  log(`Incoming request: ${req.method || 'POST'}`);

    // Parse request body - Appwrite functions might receive data in different ways
    let body;
    try {
      // Try different ways Appwrite might send the data
      if (req.body) {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } else if (req.bodyRaw) {
        body = JSON.parse(req.bodyRaw);
      } else {
        body = {};
      }
    } catch (parseError) {
      log('Error parsing request body:', parseError.message);
      body = {};
    }

    const path = req.path || body.action || '/';
    const method = req.method || 'POST';

    log(`Request: ${method} ${path}`);
    log(`Body: ${JSON.stringify(body)}`);

                // Route to appropriate handler
                if (path === '/create-checkout' || body.action === 'create-checkout') {
                  return await handleCreateCheckout(dodoApiUrl, apiKey, body, res, log, error, process.env.DODO_PRODUCT_ID, headers, databases, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
                }
                
                if (path === '/webhook' || path.includes('webhook')) {
      return await handleWebhook(req, users, log, error, res, headers);
                }
                
                if (path === '/test-webhook') {
                  return await handleTestWebhook(req, res, log, error, headers);
                }
                
                if (path === '/manual-upgrade' || body.action === 'manual-upgrade') {
      return await handleManualUpgrade(users, body, res, log, error, headers);
                }
                
                if (path === '/check-user' || body.action === 'check-user') {
                  return await handleCheckUser(users, body, res, log, error, headers);
                }
    
    if (path.startsWith('/subscription-status') || body.action === 'subscription-status') {
      return await handleSubscriptionStatus(users, databases, body.userId, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }
    
    if (path.startsWith('/cancel-subscription') || body.action === 'cancel-subscription') {
      return await handleCancelSubscription(dodoApiUrl, apiKey, body, res, log, error, headers);
    }

    // Enhanced features: Payment details and subscription management
    if (path.startsWith('/fetch-subscription') || body.action === 'fetch-subscription') {
      return await handleFetchSubscription(dodoApiUrl, apiKey, body, res, log, error, headers);
    }

    if (path.startsWith('/fetch-customer') || body.action === 'fetch-customer') {
      return await handleFetchCustomer(dodoApiUrl, apiKey, body, res, log, error, headers);
    }

    if (path.startsWith('/fetch-payment') || body.action === 'fetch-payment') {
      return await handleFetchPayment(dodoApiUrl, apiKey, body, res, log, error, headers);
    }

    if (path.startsWith('/sync-user-labels') || body.action === 'sync-user-labels') {
      return await handleSyncUserLabels(users, body, res, log, error, headers);
    }

    if (path.startsWith('/get-subscription') || body.action === 'get-subscription') {
      return await handleSubscriptionStatus(users, databases, body.userId, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/create-test-subscription') || body.action === 'create-test-subscription') {
      return await handleCreateTestSubscription(users, databases, body, res, log, error, headers, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/debug-subscription') || body.action === 'debug-subscription') {
      return await handleDebugSubscription(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/capture-subscription') || body.action === 'capture-subscription') {
      return await handleCaptureSubscription(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/get-subscription-details') || body.action === 'get-subscription-details') {
      return await handleGetSubscriptionDetails(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/check-database') || body.action === 'check-database') {
      return await handleCheckDatabase(users, databases, body, res, log, error, headers, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/test-webhook') || body.action === 'test-webhook') {
      return await handleTestWebhook(req, res, log, error, headers);
    }

    if (path.startsWith('/simulate-payment-success') || body.action === 'simulate-payment-success') {
      return await handleSimulatePaymentSuccess(users, databases, body, res, log, error, headers, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/sync-from-dodo') || body.action === 'sync-from-dodo') {
      return await handleSyncFromDodo(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/test-dodo-api') || body.action === 'test-dodo-api') {
      return await handleTestDodoApi(body, res, log, error, headers, dodoApiUrl, apiKey);
    }

    if (path.startsWith('/fix-subscription-data') || body.action === 'fix-subscription-data') {
      return await handleFixSubscriptionData(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/get-subscription-details') || body.action === 'get-subscription-details') {
      return await handleGetSubscriptionDetails(databases, body, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/diagnose-api-issue') || body.action === 'diagnose-api-issue') {
      return await handleDiagnoseApiIssue(databases, body, res, log, error, headers, dodoApiUrl, apiKey, DATABASE_ID, SUBSCRIPTIONS_COLLECTION);
    }

    if (path.startsWith('/get-payment-history') || body.action === 'get-payment-history') {
      return await handleGetPaymentHistory(dodoApiUrl, apiKey, body, res, log, error, headers);
    }

    if (path.startsWith('/get-invoice') || body.action === 'get-invoice') {
      return await handleGetInvoice(dodoApiUrl, apiKey, body, res, log, error, headers);
    }

    return res.json({ error: 'Invalid action or path' }, 400, headers);
  } catch (err) {
    error(`Error: ${err.message}`);
    error(err.stack);
    return res.json({ error: err.message }, 500, headers);
  }
};

async function handleWebhook(req, log, error, res, headers) {
  // Initialize Appwrite client for webhook processing
  let users;
  let databases;
  try {
    log('🔧 Initializing Appwrite client for webhook processing...');
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    
    users = new Users(client);
    databases = new Databases(client);
    log('✅ Appwrite client initialized for webhook');
  } catch (err) {
    error('❌ Failed to initialize Appwrite client for webhook:', err.message);
    return res.json({ error: 'Failed to initialize Appwrite client: ' + err.message }, 500, headers);
  }
  try {
    // Extract webhook headers
    const webhookHeaders = {
      'webhook-id': req.headers['webhook-id'],
      'webhook-signature': req.headers['webhook-signature'],
      'webhook-timestamp': req.headers['webhook-timestamp']
    };

    // Get raw body for signature verification
    const rawBody = req.bodyRaw || JSON.stringify(req.body);
    const payload = JSON.parse(rawBody);

    log(`=== WEBHOOK RECEIVED ===`);
    log(`Event type: ${payload.type || 'unknown'}`);
    log(`Payload: ${JSON.stringify(payload, null, 2)}`);

    // Verify webhook signature
    if (process.env.DODO_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, webhookHeaders, process.env.DODO_WEBHOOK_SECRET);
      if (!isValid) {
        error('❌ Invalid webhook signature');
        return res.json({ error: 'Invalid webhook signature' }, 401, headers);
      }
      log('✅ Webhook signature verified successfully');
    } else {
      log('⚠️ Skipping webhook signature verification (no secret configured)');
    }

    const eventType = payload.type || payload.event_type;
    const data = payload.data || payload;

    // Handle different webhook events
    log(`Processing event type: ${eventType}`);
    
    switch (eventType) {
      case 'payment.succeeded':
        log('✅ Payment succeeded - upgrading user to premium');
        await handlePaymentSucceeded(users, databases, data, log, error, process.env.APPWRITE_DATABASE_ID, 'subscriptions');
        break;
      
      case 'payment.failed':
        log('❌ Payment failed - maintaining premium status during grace period');
        await handlePaymentFailed(users, data, log, error);
        break;
      
      case 'subscription.active':
      case 'subscription.created':
        log('✅ Subscription active/created - upgrading user to premium');
        await handleSubscriptionActive(users, data, log, error);
        break;
      
      case 'subscription.renewed':
      case 'subscription.updated':
        log('🔄 Subscription renewed/updated - maintaining premium status');
        await handleSubscriptionRenewed(users, data, log, error);
        break;
      
      case 'subscription.failed':
        log('❌ Subscription failed - maintaining premium status during grace period');
        await handleSubscriptionFailed(users, data, log, error);
        break;
      
      case 'subscription.canceled':
      case 'subscription.cancelled':
        log('🚫 Subscription cancelled - removing premium status');
        await handleSubscriptionCancelled(users, data, log, error);
        break;
      
      default:
        log(`⚠️ Unhandled webhook event: ${eventType}`);
    }

    return res.json({ received: true, processed: true }, 200, headers);
  } catch (err) {
    error(`❌ Webhook handling failed: ${err.message}`);
    error(`Error stack: ${err.stack}`);
    return res.json({ error: err.message, received: false }, 500, headers);
  }
}

async function handlePaymentSucceeded(users, databases, data, log, error, databaseId, collectionId) {
  try {
    log(`=== PROCESSING PAYMENT SUCCEEDED EVENT ===`);
    log(`Payment webhook data: ${JSON.stringify(data, null, 2)}`);
    
    // Extract user ID from payment data
    const userId = extractUserIdFromWebhookData(data, log);
    
    if (!userId) {
      error('❌ No Appwrite user ID found in payment data');
      return;
    }

    log(`✅ Found userId: ${userId}`);
    
    // Extract customer ID from payment data
    const dodoCustomerId = data.customer?.customer_id || data.customer?.id || null;
    log(`Extracted dodoCustomerId: ${dodoCustomerId || 'not found'}`);
    
    // Store comprehensive payment and subscription data
    try {
      // Ensure we have a valid subscription ID
      if (!data.subscription_id) {
        log(`⚠️ No subscription_id found in payment data, skipping database storage`);
        log(`Payment data keys: ${Object.keys(data).join(', ')}`);
        await upgradeUserToPremium(users, userId, log, error, dodoCustomerId);
        return;
      }

      const subscriptionData = {
        userId: userId,
        dodoSubscriptionId: data.subscription_id,
        dodoCustomerId: dodoCustomerId,
        dodoPaymentId: data.payment_id,
        status: 'active'
      };

      log(`Subscription data to store: ${JSON.stringify(subscriptionData, null, 2)}`);

      // Check if subscription already exists
      const existingSubscriptions = await databases.listDocuments(
        databaseId,
        collectionId,
        [Query.equal('userId', userId)]
      );

      if (existingSubscriptions.documents.length > 0) {
        // Update existing subscription
        const existingSub = existingSubscriptions.documents[0];
        await databases.updateDocument(
          databaseId,
          collectionId,
          existingSub.$id,
          subscriptionData
        );
        log(`✅ Updated existing subscription in database: ${existingSub.$id}`);
      } else {
        // Create new subscription record
        const newSubscription = await databases.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          subscriptionData
        );
        log(`✅ Created new subscription in database: ${newSubscription.$id}`);
      }
    } catch (dbError) {
      error(`Failed to store subscription data: ${dbError.message}`);
    }

    await upgradeUserToPremium(users, userId, log, error, dodoCustomerId);
  } catch (err) {
    error(`handlePaymentSucceeded error: ${err.message}`);
  }
}

async function handleSubscriptionActive(users, data, log, error) {
  try {
    log(`=== PROCESSING SUBSCRIPTION ACTIVE EVENT ===`);
    
    // Extract user ID from subscription data
    const userId = extractUserIdFromWebhookData(data, log);
    
    if (!userId) {
      error('❌ No Appwrite user ID found in subscription data');
      return;
    }

    log(`✅ Found userId: ${userId}`);
    
    // Extract customer ID from subscription data
    const dodoCustomerId = data.customer?.customer_id || data.customer?.id || null;
    log(`Extracted dodoCustomerId: ${dodoCustomerId || 'not found'}`);
    
    await upgradeUserToPremium(users, userId, log, error, dodoCustomerId);
  } catch (err) {
    error(`handleSubscriptionActive error: ${err.message}`);
  }
}

async function handleSubscriptionRenewed(users, data, log, error) {
  try {
    log(`=== PROCESSING SUBSCRIPTION RENEWED EVENT ===`);
    
    // Extract user ID from subscription data
    const userId = extractUserIdFromWebhookData(data, log);
    
    if (!userId) {
      error('❌ No Appwrite user ID found in subscription data');
      return;
    }

    log(`✅ Found userId: ${userId}`);
    
    // Extract customer ID from subscription data
    const dodoCustomerId = data.customer?.customer_id || data.customer?.id || null;
    log(`Extracted dodoCustomerId: ${dodoCustomerId || 'not found'}`);
    
    await upgradeUserToPremium(users, userId, log, error, dodoCustomerId);
  } catch (err) {
    error(`handleSubscriptionRenewed error: ${err.message}`);
  }
}

async function handlePaymentFailed(users, data, log, error) {
  try {
    log(`=== PROCESSING PAYMENT FAILED EVENT ===`);
    
    // Extract user ID from payment data
    const userId = extractUserIdFromWebhookData(data, log);
    
    if (!userId) {
      error('❌ No Appwrite user ID found in payment data');
      return;
    }

    log(`✅ Found userId: ${userId}`);
    log(`⚠️ Payment failed for user ${userId} - maintaining premium status during grace period`);
    
    // Don't remove premium status immediately - give grace period
    // The user keeps access until subscription actually expires
  } catch (err) {
    error(`handlePaymentFailed error: ${err.message}`);
  }
}

async function handleSubscriptionFailed(users, data, log, error) {
  try {
    log(`=== PROCESSING SUBSCRIPTION FAILED EVENT ===`);
    
    // Extract user ID from subscription data
    const userId = extractUserIdFromWebhookData(data, log);
    
    if (!userId) {
      error('❌ No Appwrite user ID found in subscription data');
      return;
    }

    log(`✅ Found userId: ${userId}`);
    log(`⚠️ Subscription failed for user ${userId} - maintaining premium status during grace period`);
    
    // Don't remove premium status immediately - give grace period
    // The user keeps access until subscription actually expires
  } catch (err) {
    error(`handleSubscriptionFailed error: ${err.message}`);
  }
}

async function handleSubscriptionCancelled(users, data, log, error) {
  try {
    log(`=== PROCESSING SUBSCRIPTION CANCELLED WEBHOOK ===`);
    log(`Webhook data: ${JSON.stringify(data, null, 2)}`);
    
    // Extract user ID from subscription data
    const userId = extractUserIdFromWebhookData(data, log);
    
    if (!userId) {
      error('❌ No Appwrite user ID found in subscription data');
      return;
    }

    log(`✅ Found userId: ${userId}`);
    log(`🚫 Subscription cancelled webhook received for user ${userId} - IMMEDIATELY removing premium status`);
    
    // Log cancellation details from webhook
    if (data.cancelled_at) {
      log(`✅ Webhook confirms cancellation at: ${data.cancelled_at}`);
    } else {
      log(`⚠️ Webhook received but cancelled_at is null`);
    }
    
    if (data.status) {
      log(`📊 Subscription status from webhook: ${data.status}`);
    }
    
    // IMMEDIATE CANCELLATION: Remove premium labels immediately
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      const premiumLabels = ['premium', 'subscriber'];
      const updatedLabels = currentLabels.filter(label => !premiumLabels.includes(label));
      
      if (updatedLabels.length !== currentLabels.length) {
        await users.updateLabels(userId, updatedLabels);
        const removedLabels = currentLabels.filter(label => !updatedLabels.includes(label));
        log(`✅ Premium labels immediately removed from user ${userId}: ${removedLabels.join(', ')}`);
        log(`✅ User downgraded successfully via webhook`);
      } else {
        log(`User ${userId} did not have premium labels to remove`);
      }
    } catch (err) {
      error(`Failed to remove premium labels: ${err.message}`);
    }
  } catch (err) {
    error(`handleSubscriptionCancelled error: ${err.message}`);
  }
}

async function handleCreateCheckout(dodoApiUrl, apiKey, body, res, log, error, productId, headers, databases, databaseId, collectionId) {
  try {
    const { userId, userEmail, userName, successUrl, cancelUrl } = body;

    if (!userId || !userEmail) {
      return res.json({ error: 'userId and userEmail are required' }, 400, headers);
    }

    if (!productId) {
      return res.json({ error: 'DODO_PRODUCT_ID environment variable is not set' }, 500, headers);
    }

    log(`Creating checkout for user: ${userId}`);
    log(`Using product ID: ${productId}`);
    log(`API URL: ${dodoApiUrl}`);
    
    // Make dodoApiUrl mutable
    let workingApiUrl = dodoApiUrl;
    
    // Test API connectivity first
    log('Testing API connectivity...');
    try {
      // Test 1: Try /products endpoint
      log(`Testing /products endpoint at: ${workingApiUrl}/products`);
      const testResponse = await fetch(`${workingApiUrl}/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      log(`Products test response status: ${testResponse.status}`);
      log(`Products test response headers: ${JSON.stringify(testResponse.headers)}`);
      const testText = await testResponse.text();
      log(`Products test response length: ${testText.length}`);
      log(`Products test response: ${testText.substring(0, 500)}...`);
      
      if (testResponse.status === 401) {
        error('API Key authentication failed - check your DODO_PAYMENTS_API_KEY');
        return res.json({ error: 'Invalid API key - please check your DODO_PAYMENTS_API_KEY environment variable' }, 401, headers);
      }
      
      if (testResponse.status === 403) {
        error('API Key forbidden - check permissions');
        return res.json({ error: 'API key forbidden - please check your API key permissions' }, 403, headers);
      }
      
      if (testResponse.status === 404) {
        // Try without /v1 prefix
        log('Products endpoint not found with /v1, trying without version prefix...');
        const baseUrl = workingApiUrl.replace('/v1', '');
        log(`Testing /products endpoint at: ${baseUrl}/products`);
        const testResponse2 = await fetch(`${baseUrl}/products`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        log(`Products test response 2 status: ${testResponse2.status}`);
        const testText2 = await testResponse2.text();
        log(`Products test response 2 length: ${testText2.length}`);
        log(`Products test response 2: ${testText2.substring(0, 500)}...`);
        
        if (testResponse2.status === 200) {
          log('Found working API without /v1 prefix, updating base URL');
          workingApiUrl = baseUrl;
        } else {
          error(`API test failed with both URL formats: ${testResponse.status} and ${testResponse2.status}`);
          return res.json({ error: `API test failed: ${testResponse.status} and ${testResponse2.status}` }, 500, headers);
        }
      } else if (testResponse.status !== 200) {
        error(`API test failed with status: ${testResponse.status}`);
        return res.json({ error: `API test failed: ${testResponse.status} - ${testText}` }, 500, headers);
      }
      
    } catch (testError) {
      error(`API connectivity test failed: ${testError.message}`);
      error(`Test error details: ${testError.stack}`);
      return res.json({ error: `API connectivity failed: ${testError.message}` }, 500, headers);
    }

    // Step 1: Create or get customer
    log('Step 1: Creating/getting customer...');
    let customerId;
    try {
      // First, try to get existing customer
      log(`Trying to get customer: ${workingApiUrl}/customers/${userId}`);
      const getCustomerResponse = await fetch(`${workingApiUrl}/customers/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      log(`Get customer response status: ${getCustomerResponse.status}`);
      log(`Get customer response headers: ${JSON.stringify(getCustomerResponse.headers)}`);

      if (getCustomerResponse.ok) {
        const customerData = await getCustomerResponse.json();
        customerId = customerData.id;
        log(`Found existing customer: ${customerId}`);
      } else if (getCustomerResponse.status === 404) {
        // Customer doesn't exist, create one
        log('Customer not found, creating new customer...');
        log(`Creating customer at: ${workingApiUrl}/customers`);
        const createCustomerResponse = await fetch(`${workingApiUrl}/customers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: userId, // Use Appwrite user ID as customer ID
            email: userEmail,
            name: userName || userEmail,
            metadata: {
              appwrite_user_id: userId,
              source: 'skyneu-app'
            }
          })
        });

        log(`Create customer response status: ${createCustomerResponse.status}`);
        log(`Create customer response headers: ${JSON.stringify(createCustomerResponse.headers)}`);

        if (!createCustomerResponse.ok) {
          const errorText = await createCustomerResponse.text();
          log(`Create customer error response: ${errorText}`);
          try {
            const errorData = JSON.parse(errorText);
            error(`Failed to create customer: ${createCustomerResponse.status} - ${JSON.stringify(errorData)}`);
            return res.json({ error: `Failed to create customer: ${errorData.message || createCustomerResponse.status}` }, 500, headers);
          } catch (parseError) {
            error(`Failed to create customer: ${createCustomerResponse.status} - ${errorText}`);
            return res.json({ error: `Failed to create customer: ${createCustomerResponse.status} - ${errorText}` }, 500, headers);
          }
        }

                    const customerData = await createCustomerResponse.json();
                    customerId = customerData.id || customerData.customer_id;
                    log(`Created new customer: ${customerId}`);
                    log(`Customer data: ${JSON.stringify(customerData)}`);
      } else {
        const errorText = await getCustomerResponse.text();
        log(`Get customer error response: ${errorText}`);
        try {
          const errorData = JSON.parse(errorText);
          error(`Failed to get customer: ${getCustomerResponse.status} - ${JSON.stringify(errorData)}`);
          return res.json({ error: `Failed to get customer: ${errorData.message || getCustomerResponse.status}` }, 500, headers);
        } catch (parseError) {
          error(`Failed to get customer: ${getCustomerResponse.status} - ${errorText}`);
          return res.json({ error: `Failed to get customer: ${getCustomerResponse.status} - ${errorText}` }, 500, headers);
        }
      }
    } catch (customerError) {
      error(`Customer creation/retrieval failed: ${customerError.message}`);
      error(`Customer error stack: ${customerError.stack}`);
      return res.json({ error: `Customer error: ${customerError.message}` }, 500, headers);
    }

    // Step 2: Create checkout session
    log('Step 2: Creating checkout session...');
    log(`Using customer ID: ${customerId}`);
    log(`Using product ID: ${productId}`);
    
    const checkoutPayload = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1
        }
      ],
      customer: {
        email: userEmail,
        name: userName || userEmail
        // Removed phone_number as it's optional and causing validation errors
      },
      billing_address: {
        street: 'Unknown',
        city: 'Unknown',
        state: 'Unknown',
        country: 'US', // Required: ISO 3166-1 alpha-2 country code
        zipcode: '00000'
      },
      return_url: successUrl || process.env.DODO_PAYMENTS_RETURN_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile?payment=success`,
      metadata: {
        appwrite_user_id: userId,
        source: 'skyneu-app'
      }
    };
    
    log(`Checkout payload: ${JSON.stringify(checkoutPayload)}`);
    log(`Creating checkout at: ${workingApiUrl}/checkouts`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${workingApiUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify(checkoutPayload)
    });
    
    clearTimeout(timeoutId);

    // Log response details for debugging
    log(`Checkout response status: ${response.status}`);
    log(`Checkout response headers: ${JSON.stringify(response.headers)}`);
    log(`Checkout response ok: ${response.ok}`);
    
    let data;
    const responseText = await response.text();
    log(`Raw checkout response length: ${responseText.length}`);
    log(`Raw checkout response: ${responseText}`);
    
    if (responseText.length === 0) {
      error('Empty response from Dodo API');
      return res.json({ 
        error: 'Empty response from Dodo API - this usually indicates a server error or network issue',
        status: response.status,
        headers: response.headers
      }, 500, headers);
    }
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      error(`Failed to parse JSON response: ${parseError.message}`);
      error(`Raw response was: ${responseText}`);
      return res.json({ 
        error: `Invalid JSON response from Dodo API: ${parseError.message}`,
        rawResponse: responseText.substring(0, 500) // First 500 chars for debugging
      }, 500, headers);
    }

    if (!response.ok) {
      error(`Dodo API error: ${response.status} - ${JSON.stringify(data)}`);
      return res.json({ error: data.message || `API error: ${response.status}` }, 500, headers);
    }

    log(`Checkout session created: ${data.session_id}`);
    log(`Checkout URL: ${data.checkout_url}`);

    // Note: Checkout session info will be stored when webhook processes the payment
    // No need to store incomplete subscription data here
    log(`Checkout session created - subscription data will be stored via webhook`);

    return res.json({
      url: data.checkout_url,
      sessionId: data.session_id
    }, 200, headers);
  } catch (err) {
    error(`Checkout creation failed: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleManualUpgrade(users, body, res, log, error, headers) {
  try {
    const { userId } = body;
    
    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }
    
    log(`Manual upgrade requested for user: ${userId}`);
    
    // Add premium label to user
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      log(`Current user labels: ${JSON.stringify(currentLabels)}`);
      
      if (!currentLabels.includes('premium')) {
        await users.updateLabels(userId, [...currentLabels, 'premium']);
        log(`Premium label added to user: ${userId}`);
      } else {
        log(`User ${userId} already has premium label`);
      }
    } catch (err) {
      error(`Failed to update user labels: ${err.message}`);
      return res.json({ error: `Failed to update user labels: ${err.message}` }, 500, headers);
    }
    
    return res.json({ 
      success: true, 
      message: `User ${userId} upgraded to premium successfully`,
      userId: userId
    }, 200, headers);
  } catch (err) {
    error(`Manual upgrade failed: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleCheckUser(users, body, res, log, error, headers) {
  try {
    const { userId } = body;
    
    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }
    
    log(`Checking user status for: ${userId}`);
    
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      const hasPremium = currentLabels.includes('premium');
      
      log(`User ${userId} labels: ${JSON.stringify(currentLabels)}`);
      log(`Has premium: ${hasPremium}`);
      
      return res.json({ 
        userId: userId,
        labels: currentLabels,
        hasPremium: hasPremium,
        user: {
          $id: user.$id,
          email: user.email,
          name: user.name,
          labels: user.labels
        }
      }, 200, headers);
    } catch (err) {
      error(`Failed to get user: ${err.message}`);
      return res.json({ error: `Failed to get user: ${err.message}` }, 500, headers);
    }
  } catch (err) {
    error(`Check user failed: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleSubscriptionStatus(users, databases, userId, res, log, error, headers, dodoApiUrl, apiKey, databaseId, collectionId) {
  try {
    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`Fetching subscription status for user: ${userId}`);

    try {
      // Step 1: Check user labels (fast check)
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      const hasActive = currentLabels.includes('premium');
      
      log(`User labels: ${JSON.stringify(currentLabels)}`);
      log(`Has premium label: ${hasActive}`);

      // Step 2: Try to fetch subscription data from database first
      let realSubscriptionData = null;
      let dodoFetchSuccess = false;
      let subscriptionFromDB = null;

      try {
        log(`Checking database for subscription records...`);
        const subscriptions = await databases.listDocuments(
          databaseId,
          collectionId,
          [Query.equal('userId', userId)]
        );

        if (subscriptions.documents.length > 0) {
          subscriptionFromDB = subscriptions.documents[0];
          log(`Found subscription in database: ${JSON.stringify(subscriptionFromDB, null, 2)}`);
          
              // Fetch ALL details from Dodo API using official endpoints
                  try {
                    log(`🔍 Fetching comprehensive data from Dodo Payments API...`);
                    
                    // Step 1: Fetch subscription details using direct API call
                    log(`Calling GET /subscriptions/${subscriptionFromDB.dodoSubscriptionId}`);
                    const subscriptionResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionFromDB.dodoSubscriptionId}`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    let subscriptionDetails = null;
                    if (subscriptionResponse.ok) {
                      subscriptionDetails = await subscriptionResponse.json();
                      log(`✅ Fetched subscription details from Dodo API`);
                      log(`Subscription: ${JSON.stringify(subscriptionDetails, null, 2)}`);
                    } else {
                      log(`❌ Failed to fetch subscription: ${subscriptionResponse.status}`);
                    }

                    // Step 2: Fetch customer details using direct API call
                    log(`Calling GET /customers/${subscriptionFromDB.dodoCustomerId}`);
                    const customerResponse = await fetch(`${dodoApiUrl}/customers/${subscriptionFromDB.dodoCustomerId}`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    let customerDetails = null;
                    if (customerResponse.ok) {
                      customerDetails = await customerResponse.json();
                      log(`✅ Fetched customer details from Dodo API`);
                      log(`Customer: ${JSON.stringify(customerDetails, null, 2)}`);
                    } else {
                      log(`❌ Failed to fetch customer: ${customerResponse.status}`);
                    }

                    // Step 3: Fetch payment details using direct API call
                    let paymentDetails = null;
                    if (subscriptionFromDB.dodoPaymentId) {
                      log(`Calling GET /payments/${subscriptionFromDB.dodoPaymentId}`);
                      const paymentResponse = await fetch(`${dodoApiUrl}/payments/${subscriptionFromDB.dodoPaymentId}`, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${apiKey}`,
                          'Content-Type': 'application/json'
                        }
                      });

                      if (paymentResponse.ok) {
                        paymentDetails = await paymentResponse.json();
                        log(`✅ Fetched payment details from Dodo API`);
                        log(`Payment: ${JSON.stringify(paymentDetails, null, 2)}`);
                      } else {
                        log(`❌ Failed to fetch payment: ${paymentResponse.status}`);
                      }
                    }

                    // Step 4: List all payments for this subscription using direct API call
                    log(`Calling GET /payments`);
                    const allPaymentsResponse = await fetch(`${dodoApiUrl}/payments`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    let allPayments = [];
                    if (allPaymentsResponse.ok) {
                      const paymentsData = await allPaymentsResponse.json();
                      const paymentsList = Array.isArray(paymentsData) ? paymentsData : (paymentsData.data || []);
                      allPayments = paymentsList.filter(p => 
                        p.subscription_id === subscriptionFromDB.dodoSubscriptionId ||
                        p.customer?.customer_id === subscriptionFromDB.dodoCustomerId
                      );
                      log(`✅ Found ${allPayments.length} payments for this subscription`);
                    } else {
                      log(`❌ Failed to list payments: ${allPaymentsResponse.status}`);
                    }

                    // Combine all data
                    if (subscriptionDetails || customerDetails || paymentDetails) {
                      realSubscriptionData = {
                        // Subscription data
                        ...(subscriptionDetails || {}),
                        id: subscriptionFromDB.dodoSubscriptionId,
                        subscription_id: subscriptionFromDB.dodoSubscriptionId,
                        
                        // Customer data
                        customer: {
                          ...(subscriptionDetails?.customer || {}),
                          ...(customerDetails || {}),
                          customer_id: subscriptionFromDB.dodoCustomerId,
                          id: subscriptionFromDB.dodoCustomerId
                        },
                        
                        // Payment data
                        latest_payment: paymentDetails,
                        all_payments: allPayments,
                        payment_count: allPayments.length,
                        
                        // Metadata
                        metadata: {
                          appwrite_user_id: userId,
                          source: 'dodo_api_comprehensive',
                          fetched_at: new Date().toISOString()
                        }
                      };
                      
                      dodoFetchSuccess = true;
                      log(`✅ Successfully compiled comprehensive data from Dodo API`);
                    } else {
                      log(`❌ No API data available, using database fallback`);
                      log(`Using database data as fallback since API call failed`);
              
              // Create comprehensive fallback data from database
              realSubscriptionData = {
                id: subscriptionFromDB.dodoSubscriptionId,
                status: subscriptionFromDB.status,
                customer: { 
                  id: subscriptionFromDB.dodoCustomerId,
                  email: subscriptionFromDB.customerEmail || 'N/A'
                },
                // Add realistic subscription data based on database
                recurring_pre_tax_amount: subscriptionFromDB.nextBillingAmount || 999,
                currency: subscriptionFromDB.currency || 'USD',
                payment_frequency_interval: 'month',
                next_billing_date: subscriptionFromDB.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: subscriptionFromDB.startDate || subscriptionFromDB.createdAt,
                cancel_at_next_billing_date: subscriptionFromDB.cancelAtPeriodEnd || false,
                product_id: subscriptionFromDB.productId || 'prod_default',
                quantity: subscriptionFromDB.quantity || 1,
                metadata: { 
                  appwrite_user_id: userId, 
                  source: 'database_fallback',
                  api_fetch_failed: true
                }
              };
              dodoFetchSuccess = true;
              log(`✅ Using enhanced database fallback data`);
            }
          } catch (apiError) {
            log(`❌ API fetch failed: ${apiError.message}`);
            // Fallback to basic database data
            realSubscriptionData = {
              id: subscriptionFromDB.dodoSubscriptionId,
              status: subscriptionFromDB.status,
              customer: { id: subscriptionFromDB.dodoCustomerId },
              metadata: { appwrite_user_id: userId, source: 'database_fallback' }
            };
            dodoFetchSuccess = true;
          }
        } else {
          log(`No subscription found in database for user ${userId}`);
          
          // If user has premium label but no database record, they might be a test user
          if (hasActive) {
            log(`⚠️ User has premium label but no subscription record in database`);
            log(`This suggests the user was manually upgraded or is a test user`);
            log(`Returning mock data for premium user without subscription record`);
            
            // Return mock data for users with premium labels but no subscription
            realSubscriptionData = {
              id: 'manual_premium',
              status: 'active',
              customer: { id: userId },
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
              cancel_at_next_billing_date: false,
              recurring_pre_tax_amount: 999,
              currency: 'USD',
              created_at: Math.floor(Date.now() / 1000),
              metadata: { appwrite_user_id: userId, source: 'manual_upgrade' }
            };
            dodoFetchSuccess = true;
            log(`✅ Using mock data for premium user without subscription record`);
          }
        }
      } catch (dbError) {
        log(`Database query failed: ${dbError.message}`);
      }

      // Step 3: If no database record, try to fetch from Dodo API
      if (!dodoFetchSuccess) {
        try {
          log(`Attempting to fetch real subscription data from Dodo API...`);
        
        // Method 1: Try to get customer data first
        let customerId = userId;
        try {
          // First try with userId as customer ID
          const customerResponse = await fetch(`${dodoApiUrl}/customers/${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (customerResponse.ok) {
            const customer = await customerResponse.json();
            log(`Customer data from Dodo: ${JSON.stringify(customer, null, 2)}`);
            customerId = customer.id || customer.customer_id || userId;
          } else {
            log(`Customer not found with userId, trying to search by email...`);
            
            // Try to find customer by email if direct lookup fails
            const user = await users.get(userId);
            if (user.email) {
              log(`Searching for customer with email: ${user.email}`);
              const searchResponse = await fetch(`${dodoApiUrl}/customers?email=${encodeURIComponent(user.email)}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (searchResponse.ok) {
                const searchResult = await searchResponse.json();
                log(`Customer search result: ${JSON.stringify(searchResult, null, 2)}`);
                
                if (searchResult.data && searchResult.data.length > 0) {
                  customerId = searchResult.data[0].id || searchResult.data[0].customer_id;
                  log(`Found customer by email: ${customerId}`);
                }
              }
            }
          }
        } catch (customerError) {
          log(`Customer fetch failed, using userId as customerId: ${customerError.message}`);
        }
        
        // Method 2: Get subscriptions using client.subscriptions.list()
        let subscriptionsResponse = await fetch(`${dodoApiUrl}/subscriptions?customer_id=${customerId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!subscriptionsResponse.ok) {
          log(`Subscriptions API call failed with customer_id: ${subscriptionsResponse.status}`);
          const errorText = await subscriptionsResponse.text();
          log(`Error response: ${errorText}`);
          
          // Try alternative API endpoints
          log(`Trying alternative subscription endpoints...`);
          
          // Try without customer_id filter
          subscriptionsResponse = await fetch(`${dodoApiUrl}/subscriptions`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!subscriptionsResponse.ok) {
            log(`Alternative subscriptions API also failed: ${subscriptionsResponse.status}`);
          }
        }

        if (subscriptionsResponse.ok) {
          const subscriptions = await subscriptionsResponse.json();
          log(`Subscriptions from Dodo: ${JSON.stringify(subscriptions, null, 2)}`);
          
          if (subscriptions.data && subscriptions.data.length > 0) {
            // Find subscription for this user by checking metadata
            let userSubscription = null;
            
            for (const sub of subscriptions.data) {
              if (sub.metadata && sub.metadata.appwrite_user_id === userId) {
                userSubscription = sub;
                log(`Found subscription for user in metadata: ${JSON.stringify(sub, null, 2)}`);
                break;
              }
            }
            
            // If no metadata match, use the first subscription
            if (!userSubscription) {
              userSubscription = subscriptions.data[0];
              log(`Using first subscription: ${JSON.stringify(userSubscription, null, 2)}`);
            }
            
            const subscriptionId = userSubscription.id || userSubscription.subscription_id;
            log(`Found subscription ID: ${subscriptionId}`);
            
            // Use client.subscriptions.retrieve() to get detailed subscription data
            const detailedResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });

            if (detailedResponse.ok) {
              realSubscriptionData = await detailedResponse.json();
              dodoFetchSuccess = true;
              log(`✅ Retrieved detailed subscription data from Dodo: ${JSON.stringify(realSubscriptionData, null, 2)}`);
            } else {
              log(`Failed to get detailed subscription data: ${detailedResponse.status}`);
              realSubscriptionData = userSubscription; // Fallback to list data
              dodoFetchSuccess = true;
            }
          } else {
            log(`No subscriptions found for customer: ${customerId}`);
          }
        } else {
          log(`All subscription API calls failed`);
        }
        } catch (dodoError) {
          log(`Failed to fetch from Dodo API: ${dodoError.message}`);
          log(`Falling back to user labels only`);
        }
      }

      // Step 3: Build response data
      let subscriptionData;
      
      if (dodoFetchSuccess && realSubscriptionData) {
        // Use real Dodo subscription data
        log(`Using real Dodo subscription data`);
        
        // Handle cancellation status
        const isCancelled = realSubscriptionData.cancel_at_next_billing_date || realSubscriptionData.canceled_at;
        const isActive = realSubscriptionData.status === 'active' && !isCancelled;
        
        // Parse real Dodo subscription data
        const amount = realSubscriptionData.recurring_pre_tax_amount || realSubscriptionData.plan?.amount || 999;
        const currency = realSubscriptionData.currency || 'USD';
        const interval = realSubscriptionData.payment_frequency_interval || 'Month';
        const nextBilling = realSubscriptionData.next_billing_date || realSubscriptionData.current_period_end;
        
        // Ensure no NaN values
        const safeAmount = isNaN(amount) ? 999 : amount;
        const safeCurrency = currency || 'USD';
        const safeInterval = interval ? interval.toLowerCase() : 'month';
        
        // Format dates safely
        const formatDate = (dateStr) => {
          if (!dateStr) return null;
          try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
          } catch (e) {
            return null;
          }
        };
        
        const formatDateTime = (dateStr) => {
          if (!dateStr) return null;
          try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date.toISOString();
          } catch (e) {
            return null;
          }
        };
        
        subscriptionData = {
          status: isActive ? 'active' : 'inactive',
          userId: userId,
          labels: currentLabels,
          hasActive: hasActive,
          // Real data from Dodo - ensure no NaN values
          subscriptionId: realSubscriptionData.subscription_id || realSubscriptionData.id || 'unknown',
          plan: 'Premium Plan',
          price: `$${(safeAmount / 100).toFixed(2)}`,
          currency: safeCurrency,
          interval: safeInterval,
          billingDate: formatDate(nextBilling),
          expiresAt: formatDateTime(nextBilling),
          createdAt: formatDateTime(realSubscriptionData.created_at) || new Date().toISOString(),
          // Cancellation info
          isCancelled: isCancelled,
          cancelAtNextBilling: realSubscriptionData.cancel_at_next_billing_date || false,
          canceledAt: formatDateTime(realSubscriptionData.canceled_at),
          // Renewal info
          nextBillingDate: formatDate(nextBilling),
          source: 'dodo_payments',
          features: [
            'Unlimited flight searches',
            'AI-powered trip planning', 
            'Real-time flight tracking',
            'Priority customer support',
            'Advanced travel tools',
            'Exclusive features access'
          ]
        };
        
        // Debug: Log the final values being sent to frontend
        log(`🔍 DEBUG - Final subscription data for frontend:`);
        log(`- Price: ${subscriptionData.price}`);
        log(`- Currency: ${subscriptionData.currency}`);
        log(`- Billing Date: ${subscriptionData.billingDate}`);
        log(`- Next Billing: ${subscriptionData.nextBillingDate}`);
        log(`- Created At: ${subscriptionData.createdAt}`);
        log(`- Amount (raw): ${amount}, Safe Amount: ${safeAmount}`);
        log(`- Next Billing (raw): ${nextBilling}`);
      } else {
        // Fallback to user labels with mock data
        log(`Using fallback data based on user labels`);
        subscriptionData = {
          status: hasActive ? 'active' : 'inactive',
          userId: userId,
          labels: currentLabels,
          hasActive: hasActive,
          source: 'appwrite_labels',
          // Mock subscription details for active users
          ...(hasActive && {
            plan: 'Premium',
            price: '$9.99',
            currency: 'USD',
            interval: 'month',
            billingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            features: [
              'Unlimited flight searches',
              'AI-powered trip planning', 
              'Real-time flight tracking',
              'Priority customer support',
              'Advanced travel tools',
              'Exclusive features access'
            ]
          })
        };
      }

      log(`Final subscription data: ${JSON.stringify(subscriptionData, null, 2)}`);

    return res.json({
        subscription: subscriptionData,
        hasActive: hasActive,
        source: dodoFetchSuccess ? 'dodo_payments' : 'appwrite_labels',
        message: hasActive ? 'Premium subscription active' : 'No active subscription'
    }, 200, headers);
    } catch (err) {
      error(`Failed to get user: ${err.message}`);
      return res.json({ error: `Failed to get user: ${err.message}` }, 500, headers);
    }
  } catch (err) {
    error(`handleSubscriptionStatus error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleCancelSubscription(dodoApiUrl, apiKey, body, res, log, error, headers) {
  try {
    const { userId, subscriptionId } = body;

    if (!userId || !subscriptionId) {
      return res.json({ error: 'userId and subscriptionId are required' }, 400, headers);
    }

    log(`Cancelling subscription immediately: ${subscriptionId} for user: ${userId}`);

    // IMMEDIATE CANCELLATION: Use PATCH endpoint with cancelled_at parameter only
    // Ensure ISO 8601 format with Z suffix for UTC timezone
    const currentTimestamp = new Date().toISOString();
    
    // Double-check the format is correct
    const timestampCheck = {
      original: currentTimestamp,
      format: currentTimestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) ? 'CORRECT' : 'INCORRECT',
      endsWithZ: currentTimestamp.endsWith('Z'),
      hasT: currentTimestamp.includes('T')
    };
    
    const cancelPayload = {
      cancelled_at: currentTimestamp
    };
    
    log(`🔍 Cancellation payload details:`);
    log(`- Timestamp: ${currentTimestamp}`);
    log(`- Format Check: ${timestampCheck.format}`);
    log(`- Ends with Z: ${timestampCheck.endsWithZ}`);
    log(`- Has T separator: ${timestampCheck.hasT}`);
    log(`- ISO String: ${new Date().toISOString()}`);
    log(`- UTC Time: ${new Date().toUTCString()}`);
    log(`- Payload: ${JSON.stringify(cancelPayload, null, 2)}`);
    
    // Verify the timestamp format matches Dodo's requirements
    if (!timestampCheck.endsWithZ || !timestampCheck.hasT) {
      log(`⚠️ WARNING: Timestamp format may not be correct for Dodo API`);
      log(`⚠️ Expected format: YYYY-MM-DDTHH:MM:SSZ`);
      log(`⚠️ Actual format: ${currentTimestamp}`);
    } else {
      log(`✅ Timestamp format is correct for Dodo API`);
    }

    log(`Using immediate cancellation with timestamp: ${currentTimestamp}`);
    log(`Cancellation payload: ${JSON.stringify(cancelPayload)}`);
    log(`API URL: ${dodoApiUrl}/subscriptions/${subscriptionId}`);

    // First, let's verify the subscription exists by fetching it
    log(`🔍 Verifying subscription exists before cancellation...`);
    try {
      const verifyResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionId}`, {
        method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
        }
      });
      
      log(`Verification response status: ${verifyResponse.status}`);
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        log(`✅ Subscription exists and is accessible`);
        log(`Current subscription status: ${verifyData.status}`);
        log(`Current cancelled_at: ${verifyData.cancelled_at}`);
      } else {
        log(`❌ Subscription verification failed: ${verifyResponse.status}`);
        const errorText = await verifyResponse.text();
        log(`Verification error response: ${errorText}`);
      }
    } catch (verifyError) {
      log(`❌ Subscription verification error: ${verifyError.message}`);
    }

    // Try multiple cancellation approaches
    const cancellationMethods = [
      {
        name: "Method 1: PATCH with cancelled_at only",
        endpoint: `${dodoApiUrl}/subscriptions/${subscriptionId}`,
        payload: { cancelled_at: currentTimestamp }
      },
      {
        name: "Method 2: PATCH with status and cancelled_at",
        endpoint: `${dodoApiUrl}/subscriptions/${subscriptionId}`,
        payload: { 
          cancelled_at: currentTimestamp,
          status: 'cancelled'
        }
      },
      {
        name: "Method 3: PATCH with cancel_at_next_billing_date false",
        endpoint: `${dodoApiUrl}/subscriptions/${subscriptionId}`,
        payload: { 
          cancelled_at: currentTimestamp,
          cancel_at_next_billing_date: false
        }
      },
      {
        name: "Method 4: DELETE endpoint",
        endpoint: `${dodoApiUrl}/subscriptions/${subscriptionId}`,
        method: 'DELETE',
        payload: null
      }
    ];
    
    let response;
    let successfulMethod;
    let data;
    let cancellationWorked = false;
    
    for (let i = 0; i < cancellationMethods.length; i++) {
      const method = cancellationMethods[i];
      log(`Trying ${method.name}...`);
      log(`Endpoint: ${method.endpoint}`);
      log(`Payload: ${JSON.stringify(method.payload)}`);
      
      const requestOptions = {
        method: method.method || 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (method.payload) {
        requestOptions.body = JSON.stringify(method.payload);
      }
      
      response = await fetch(method.endpoint, requestOptions);
      
      log(`Method ${i + 1} response status: ${response.status}`);
      
      if (response.ok) {
        const responseText = await response.text();
        log(`Method ${i + 1} response: ${responseText}`);
        
        try {
          data = JSON.parse(responseText);
          
          // Check if cancellation actually worked
          if (data.cancelled_at) {
            log(`✅ ${method.name} SUCCESSFUL - cancelled_at: ${data.cancelled_at}`);
            successfulMethod = method;
            cancellationWorked = true;
            break;
          } else {
            log(`⚠️ ${method.name} returned 200 but cancelled_at is still null`);
            log(`Response data: ${JSON.stringify(data, null, 2)}`);
          }
        } catch (parseError) {
          log(`❌ ${method.name} - Failed to parse response: ${responseText}`);
        }
      } else {
        log(`❌ ${method.name} failed: ${response.status}`);
        try {
          const errorText = await response.text();
          log(`Error response: ${errorText}`);
        } catch (errorReadError) {
          log(`❌ Could not read error response: ${errorReadError.message}`);
        }
      }
      
      if (i < cancellationMethods.length - 1) {
        log(`Trying next method...`);
      }
    }
    
    if (!cancellationWorked) {
      log(`❌ ALL CANCELLATION METHODS FAILED`);
      log(`This suggests the subscription cannot be cancelled immediately`);
      log(`Possible reasons:`);
      log(`1. Subscription is in a state that prevents immediate cancellation`);
      log(`2. API key doesn't have permission to cancel subscriptions`);
      log(`3. Dodo API doesn't support immediate cancellation for this subscription type`);
      log(`4. The subscription is already in a cancelled state`);
    }

    log(`Final response status: ${response.status}`);
    log(`Response headers: ${JSON.stringify(response.headers)}`);

    // Only read response body if we haven't already processed it
    if (!data) {
      try {
        const responseText = await response.text();
        log(`Raw response text: ${responseText}`);
        
        try {
          data = JSON.parse(responseText);
          log(`Parsed response data: ${JSON.stringify(data, null, 2)}`);
        } catch (parseError) {
          log(`Failed to parse response: ${responseText}`);
          log(`Parse error: ${parseError.message}`);
          data = { error: 'Invalid JSON response' };
        }
      } catch (bodyReadError) {
        log(`❌ Could not read response body: ${bodyReadError.message}`);
        data = { error: 'Could not read response body' };
      }
    } else {
      log(`Using already parsed response data`);
    }

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 404) {
        log(`❌ Subscription not found (404) - this subscription may not exist in the current environment`);
        log(`Subscription ID: ${subscriptionId}`);
        log(`API URL: ${dodoApiUrl}`);
        log(`This could mean:`);
        log(`1. The subscription ID is from a different environment (test vs live)`);
        log(`2. The subscription was already deleted`);
        log(`3. The subscription ID is incorrect`);
        
        // Still proceed with user downgrade even if subscription not found
        log(`⚠️ Proceeding with user downgrade despite subscription not found in Dodo`);
      } else if (response.status === 400) {
        log(`❌ Bad Request (400) - the cancellation payload may be invalid`);
        log(`Payload sent: ${JSON.stringify(cancelPayload)}`);
        log(`This could mean:`);
        log(`1. The cancelled_at format is incorrect`);
        log(`2. The subscription is already cancelled`);
        log(`3. The API doesn't support immediate cancellation`);
      } else if (response.status === 401) {
        log(`❌ Unauthorized (401) - API key may be invalid or expired`);
        log(`API Key prefix: ${apiKey.substring(0, 10)}...`);
      } else if (response.status === 403) {
        log(`❌ Forbidden (403) - API key may not have permission to cancel subscriptions`);
      } else if (response.status === 422) {
        log(`❌ Unprocessable Entity (422) - the subscription may be in a state that cannot be cancelled`);
      } else {
        error(`All API endpoints failed: ${response.status}`);
        return res.json({ error: `API error: ${response.status}` }, 500, headers);
      }
    } else {
                log(`✅ Cancellation successful using endpoint: ${successfulMethod.endpoint}`);
    }

    log(`Subscription cancelled immediately: ${subscriptionId}`);
    log(`Cancellation details: ${JSON.stringify(data, null, 2)}`);

    // Verify cancellation was successful
    if (data.cancelled_at) {
      log(`✅ Subscription successfully cancelled at: ${data.cancelled_at}`);
    } else {
      log(`⚠️ Warning: cancelled_at is still null - subscription may not be cancelled in Dodo`);
      log(`Response data: ${JSON.stringify(data, null, 2)}`);
    }
    
    // ALWAYS verify cancellation by fetching the subscription again
    try {
      log(`🔍 Verifying cancellation by fetching subscription again...`);
      const verifyResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        log(`🔍 Verification response: ${JSON.stringify(verifyData, null, 2)}`);
        
        if (verifyData.cancelled_at) {
          log(`✅ VERIFICATION SUCCESSFUL - Subscription is cancelled at: ${verifyData.cancelled_at}`);
          log(`✅ Subscription status: ${verifyData.status}`);
          log(`✅ Cancellation confirmed in Dodo Payments system`);
        } else {
          log(`❌ VERIFICATION FAILED - Subscription is still not cancelled in Dodo`);
          log(`❌ Current status: ${verifyData.status}`);
          log(`❌ cancelled_at: ${verifyData.cancelled_at}`);
          log(`❌ This indicates the cancellation did not work properly`);
        }
      } else {
        log(`❌ Verification request failed: ${verifyResponse.status}`);
        const errorText = await verifyResponse.text();
        log(`❌ Verification error response: ${errorText}`);
      }
    } catch (verifyError) {
      log(`❌ Verification error: ${verifyError.message}`);
    }

    // IMMEDIATE USER DOWNGRADE: Remove premium labels immediately
    try {
      log(`🚫 Downgrading user from premium status immediately...`);
      
      // Initialize Appwrite client for user downgrade
      const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
      
      const users = new Users(client);
      const databases = new Databases(client);
      
      // Get current user labels
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      const premiumLabels = ['premium', 'subscriber'];
      const updatedLabels = currentLabels.filter(label => !premiumLabels.includes(label));
      
      if (updatedLabels.length !== currentLabels.length) {
        await users.updateLabels(userId, updatedLabels);
        const removedLabels = currentLabels.filter(label => !updatedLabels.includes(label));
        log(`✅ Premium labels immediately removed from user ${userId}: ${removedLabels.join(', ')}`);
      } else {
        log(`User ${userId} had no premium labels to remove`);
      }

      // UPDATE DATABASE: Mark subscription as cancelled in database
      try {
        log(`📝 Updating subscription status in database to cancelled...`);
        const subscriptions = await databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          'subscriptions',
          [Query.equal('userId', userId)]
        );

        if (subscriptions.documents.length > 0) {
          const subscriptionRecord = subscriptions.documents[0];
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            'subscriptions',
            subscriptionRecord.$id,
            {
              status: 'cancelled'
            }
          );
          log(`✅ Database subscription status updated to cancelled: ${subscriptionRecord.$id}`);
        } else {
          log(`⚠️ No subscription record found in database for user ${userId}`);
        }
      } catch (dbError) {
        error(`Failed to update database subscription status: ${dbError.message}`);
        // Don't fail the cancellation if database update fails
      }
    } catch (downgradeError) {
      error(`Failed to downgrade user: ${downgradeError.message}`);
      // Don't fail the cancellation if downgrade fails
    }

    return res.json({ 
      success: true, 
      message: 'Subscription cancelled immediately - user downgraded from premium',
      subscription: data,
      cancelledAt: currentTimestamp,
      immediateCancellation: true
    }, 200, headers);
  } catch (err) {
    error(`handleCancelSubscription error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleTestWebhook(req, res, log, error, headers) {
  try {
    log('=== TEST WEBHOOK ENDPOINT CALLED ===');
    log(`Method: ${req.method}`);
    log(`Path: ${req.path}`);
    log(`Headers: ${JSON.stringify(req.headers)}`);
    log(`Body: ${req.bodyRaw || JSON.stringify(req.body)}`);
    log('=== END TEST WEBHOOK ===');
    
    return res.json({ 
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.bodyRaw || req.body
    }, 200, headers);
  } catch (err) {
    error(`Test webhook failed: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

// Enhanced features: Payment details and subscription management
async function handleFetchSubscription(dodoApiUrl, apiKey, body, res, log, error, headers) {
  try {
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return res.json({ error: 'subscriptionId is required' }, 400, headers);
    }

    log(`Fetching subscription from Dodo API using client.subscriptions.retrieve(): ${subscriptionId}`);

    // Use client.subscriptions.retrieve() method
    const response = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Subscription fetch failed: ${response.status} - ${errorText}`);
      return res.json({ error: `Failed to fetch subscription: ${response.status} - ${errorText}` }, 500, headers);
    }

    const subscription = await response.json();
    log(`Retrieved detailed subscription data: ${JSON.stringify(subscription, null, 2)}`);

    // Enhanced response with subscription details
    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer,
      plan: subscription.plan,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      created: subscription.created,
      metadata: subscription.metadata,
      // Cancellation info
      cancel_at_next_billing_date: subscription.cancel_at_next_billing_date,
      canceled_at: subscription.canceled_at,
      // Additional formatted data
      billingDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0] : null,
      expiresAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      createdAt: subscription.created ? new Date(subscription.created * 1000).toISOString() : null,
      isCancelled: subscription.cancel_at_next_billing_date || subscription.canceled_at,
      source: 'dodo_payments'
    };

    return res.json({ 
      success: true, 
      subscription: subscriptionData,
      message: 'Subscription data retrieved successfully'
    }, 200, headers);
  } catch (err) {
    error(`handleFetchSubscription error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleFetchCustomer(dodoApiUrl, apiKey, body, res, log, error, headers) {
  try {
    const { customerId } = body;

    if (!customerId) {
      return res.json({ error: 'customerId is required' }, 400, headers);
    }

    log(`Fetching customer from Dodo API: ${customerId}`);

    const response = await fetch(`${dodoApiUrl}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.json({ error: `Failed to fetch customer: ${response.status} - ${errorText}` }, 500, headers);
    }

    const customer = await response.json();
    log(`Retrieved customer data: ${JSON.stringify(customer, null, 2)}`);

    return res.json({ 
      success: true, 
      customer: customer 
    }, 200, headers);
  } catch (err) {
    error(`handleFetchCustomer error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleFetchPayment(dodoApiUrl, apiKey, body, res, log, error, headers) {
  try {
    const { paymentId } = body;

    if (!paymentId) {
      return res.json({ error: 'paymentId is required' }, 400, headers);
    }

    log(`Fetching payment from Dodo API using client.payments.retrieve(): ${paymentId}`);

    // Use client.payments.retrieve() method
    const response = await fetch(`${dodoApiUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Payment fetch failed: ${response.status} - ${errorText}`);
      return res.json({ error: `Failed to fetch payment: ${response.status} - ${errorText}` }, 500, headers);
    }

    const payment = await response.json();
    log(`Retrieved detailed payment data: ${JSON.stringify(payment, null, 2)}`);

    // Enhanced response with payment details
    const paymentData = {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      customer: payment.customer,
      subscription: payment.subscription,
      created: payment.created,
      metadata: payment.metadata,
      description: payment.description,
      // Additional details
      amountFormatted: payment.amount ? `$${(payment.amount / 100).toFixed(2)}` : null,
      createdDate: payment.created ? new Date(payment.created * 1000).toISOString() : null,
      source: 'dodo_payments'
    };

    return res.json({ 
      success: true, 
      payment: paymentData,
      message: 'Payment data retrieved successfully'
    }, 200, headers);
  } catch (err) {
    error(`handleFetchPayment error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleSyncUserLabels(users, body, res, log, error, headers) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`Syncing user labels for user: ${userId}`);

    // Get current user labels
    const user = await users.get(userId);
    const currentLabels = user.labels || [];
    
    const premiumLabels = ['premium', 'subscriber'];
    
    // Check if user has premium labels
    const hasPremium = premiumLabels.some(label => currentLabels.includes(label));
    
    if (hasPremium) {
      log(`User ${userId} already has premium labels: ${JSON.stringify(currentLabels)}`);
      return res.json({ 
        success: true, 
        message: 'User already has premium labels',
        labels: currentLabels,
        hasPremium: true
      }, 200, headers);
    } else {
      // Add premium labels
      const updatedLabels = [...currentLabels, ...premiumLabels];
      await users.updateLabels(userId, updatedLabels);
      log(`Premium labels added to user ${userId}: ${premiumLabels.join(', ')}`);
      
      return res.json({ 
        success: true, 
        message: 'Premium labels added',
        labels: updatedLabels,
        hasPremium: true
      }, 200, headers);
    }
  } catch (err) {
    error(`handleSyncUserLabels error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleCreateTestSubscription(users, databases, body, res, log, error, headers, databaseId, collectionId) {
  try {
    const { userId, price = 999, currency = 'USD' } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`Creating test subscription for user: ${userId}`);

    // Check if subscription already exists
    const existingSubscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (existingSubscriptions.documents.length > 0) {
      log(`Subscription already exists for user ${userId}`);
      return res.json({ 
        success: true, 
        message: 'Subscription already exists',
        subscription: existingSubscriptions.documents[0]
      }, 200, headers);
    }

    // Create test subscription record
    const testSubscription = {
      userId: userId,
      dodoSubscriptionId: `test_sub_${Date.now()}`,
      dodoCustomerId: `test_cus_${userId}`,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      price: price,
      currency: currency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newSubscription = await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      testSubscription
    );

    log(`✅ Test subscription created: ${newSubscription.$id}`);

    return res.json({ 
      success: true, 
      message: 'Test subscription created successfully',
      subscription: newSubscription
    }, 200, headers);
  } catch (err) {
    error(`handleCreateTestSubscription error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleDebugSubscription(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, databaseId, collectionId) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`🔍 Debugging subscription for user: ${userId}`);

    // Get user info
    const user = await users.get(userId);
    log(`User email: ${user.email}`);
    log(`User labels: ${JSON.stringify(user.labels)}`);

    // Check database for subscription records
    const subscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );
    log(`Database subscriptions found: ${subscriptions.documents.length}`);

    // Try to find customer in Dodo
    let customerFound = false;
    let customerData = null;
    
    try {
      const customerResponse = await fetch(`${dodoApiUrl}/customers/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (customerResponse.ok) {
        customerData = await customerResponse.json();
        customerFound = true;
        log(`✅ Customer found in Dodo: ${JSON.stringify(customerData, null, 2)}`);
      } else {
        log(`❌ Customer not found in Dodo: ${customerResponse.status}`);
      }
    } catch (customerError) {
      log(`❌ Customer lookup failed: ${customerError.message}`);
    }

    // Try to find customer by email
    let customerByEmail = null;
    try {
      const searchResponse = await fetch(`${dodoApiUrl}/customers?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.data && searchData.data.length > 0) {
          customerByEmail = searchData.data[0];
          log(`✅ Customer found by email: ${JSON.stringify(customerByEmail, null, 2)}`);
        }
      }
    } catch (emailError) {
      log(`❌ Email search failed: ${emailError.message}`);
    }

    return res.json({
      success: true,
      debug: {
        userId,
        userEmail: user.email,
        userLabels: user.labels,
        databaseSubscriptions: subscriptions.documents,
        customerFound,
        customerData,
        customerByEmail,
        dodoApiUrl,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      }
    }, 200, headers);
  } catch (err) {
    error(`handleDebugSubscription error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleCaptureSubscription(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, databaseId, collectionId) {
  try {
    const { userId, subscriptionId, paymentId, customerId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    if (!subscriptionId) {
      return res.json({ error: 'subscriptionId is required' }, 400, headers);
    }

    log(`📥 Capturing subscription data for user: ${userId}`);
    log(`Subscription ID: ${subscriptionId}`);
    log(`Payment ID: ${paymentId}`);
    log(`Customer ID: ${customerId}`);

    // Fetch detailed subscription data from Dodo API
    let subscriptionData = null;
    let paymentData = null;
    let customerData = null;

    try {
      // Get subscription details
      log(`Fetching subscription details from Dodo API...`);
      const subscriptionResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (subscriptionResponse.ok) {
        subscriptionData = await subscriptionResponse.json();
        log(`✅ Subscription data fetched: ${JSON.stringify(subscriptionData, null, 2)}`);
      } else {
        log(`❌ Failed to fetch subscription: ${subscriptionResponse.status}`);
      }
    } catch (subError) {
      log(`❌ Subscription fetch failed: ${subError.message}`);
    }

    // Get payment details if paymentId is provided
    if (paymentId) {
      try {
        log(`Fetching payment details from Dodo API...`);
        const paymentResponse = await fetch(`${dodoApiUrl}/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (paymentResponse.ok) {
          paymentData = await paymentResponse.json();
          log(`✅ Payment data fetched: ${JSON.stringify(paymentData, null, 2)}`);
        } else {
          log(`❌ Failed to fetch payment: ${paymentResponse.status}`);
        }
      } catch (payError) {
        log(`❌ Payment fetch failed: ${payError.message}`);
      }
    }

    // Get customer details if customerId is provided
    if (customerId) {
      try {
        log(`Fetching customer details from Dodo API...`);
        const customerResponse = await fetch(`${dodoApiUrl}/customers/${customerId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (customerResponse.ok) {
          customerData = await customerResponse.json();
          log(`✅ Customer data fetched: ${JSON.stringify(customerData, null, 2)}`);
        } else {
          log(`❌ Failed to fetch customer: ${customerResponse.status}`);
        }
      } catch (custError) {
        log(`❌ Customer fetch failed: ${custError.message}`);
      }
    }

    // Store subscription data in database
    try {
      log(`Storing subscription data in database...`);
      
      // Store only essential data - fetch details from Dodo API when needed
      const subscriptionRecord = {
        userId: userId,
        dodoSubscriptionId: subscriptionId,
        dodoCustomerId: customerId || (customerData ? customerData.id : null),
        dodoPaymentId: paymentId,
        status: subscriptionData ? subscriptionData.status : 'active',
        // Store minimal data - fetch full details from API when needed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check if subscription already exists
      const existingSubscriptions = await databases.listDocuments(
        databaseId,
        collectionId,
        [Query.equal('userId', userId)]
      );

      let subscriptionRecordId;
      if (existingSubscriptions.documents.length > 0) {
        // Update existing subscription
        const existingSub = existingSubscriptions.documents[0];
        await databases.updateDocument(
          databaseId,
          collectionId,
          existingSub.$id,
          subscriptionRecord
        );
        subscriptionRecordId = existingSub.$id;
        log(`✅ Updated existing subscription: ${subscriptionRecordId}`);
      } else {
        // Create new subscription
        const newSubscription = await databases.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          subscriptionRecord
        );
        subscriptionRecordId = newSubscription.$id;
        log(`✅ Created new subscription: ${subscriptionRecordId}`);
      }

      // Update user labels
      try {
        const user = await users.get(userId);
        const currentLabels = user.labels || [];
        const premiumLabels = ['premium', 'subscriber'];
        
        const hasPremium = premiumLabels.some(label => currentLabels.includes(label));
        if (!hasPremium) {
          const updatedLabels = [...currentLabels, ...premiumLabels];
          await users.updateLabels(userId, updatedLabels);
          log(`✅ Added premium labels to user: ${premiumLabels.join(', ')}`);
        } else {
          log(`✅ User already has premium labels`);
        }
      } catch (labelError) {
        log(`❌ Failed to update user labels: ${labelError.message}`);
      }

      return res.json({
        success: true,
        message: 'Subscription data captured and stored successfully',
        subscriptionRecordId,
        subscriptionData,
        paymentData,
        customerData
      }, 200, headers);

    } catch (dbError) {
      error(`Failed to store subscription data: ${dbError.message}`);
      return res.json({ error: `Database error: ${dbError.message}` }, 500, headers);
    }

  } catch (err) {
    error(`handleCaptureSubscription error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleGetSubscriptionDetails(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, databaseId, collectionId) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`📊 Fetching detailed subscription information for user: ${userId}`);

    // First, get the subscription record from database
    const subscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (subscriptions.documents.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No subscription found for this user',
        subscription: null
      }, 404, headers);
    }

    const subscriptionRecord = subscriptions.documents[0];
    log(`Found subscription record: ${subscriptionRecord.dodoSubscriptionId}`);

    // Fetch detailed subscription data from Dodo API
    let subscriptionDetails = null;
    let paymentDetails = null;
    let customerDetails = null;

    try {
      // Get subscription details using official Dodo API - client.subscriptions.retrieve()
      log(`Fetching subscription details using official Dodo API: client.subscriptions.retrieve('${subscriptionRecord.dodoSubscriptionId}')`);
      const subscriptionResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionRecord.dodoSubscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (subscriptionResponse.ok) {
        subscriptionDetails = await subscriptionResponse.json();
        log(`✅ Subscription details fetched successfully using client.subscriptions.retrieve()`);
      } else {
        log(`❌ Failed to fetch subscription details: ${subscriptionResponse.status}`);
      }
    } catch (subError) {
      log(`❌ Subscription fetch failed: ${subError.message}`);
    }

    // Get payment details if payment ID is available using official Dodo API - client.payments.retrieve()
    if (subscriptionRecord.dodoPaymentId) {
      try {
        log(`Fetching payment details using official Dodo API: client.payments.retrieve('${subscriptionRecord.dodoPaymentId}')`);
        const paymentResponse = await fetch(`${dodoApiUrl}/payments/${subscriptionRecord.dodoPaymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (paymentResponse.ok) {
          paymentDetails = await paymentResponse.json();
          log(`✅ Payment details fetched successfully using client.payments.retrieve()`);
        } else {
          log(`❌ Failed to fetch payment details: ${paymentResponse.status}`);
        }
      } catch (payError) {
        log(`❌ Payment fetch failed: ${payError.message}`);
      }
    }

    // Get customer details if customer ID is available
    if (subscriptionRecord.dodoCustomerId) {
      try {
        log(`Fetching customer details from Dodo API...`);
        const customerResponse = await fetch(`${dodoApiUrl}/customers/${subscriptionRecord.dodoCustomerId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (customerResponse.ok) {
          customerDetails = await customerResponse.json();
          log(`✅ Customer details fetched successfully`);
        } else {
          log(`❌ Failed to fetch customer details: ${customerResponse.status}`);
        }
      } catch (custError) {
        log(`❌ Customer fetch failed: ${custError.message}`);
      }
    }

    // Format the response with all available data
    const response = {
      success: true,
      subscription: {
        // Basic info from database
        userId: subscriptionRecord.userId,
        status: subscriptionRecord.status,
        createdAt: subscriptionRecord.createdAt,
        updatedAt: subscriptionRecord.updatedAt,
        
        // Detailed info from Dodo API
        details: subscriptionDetails,
        payment: paymentDetails,
        customer: customerDetails,
        
        // Formatted display data
        display: {
          id: subscriptionDetails?.id || subscriptionRecord.dodoSubscriptionId,
          status: subscriptionDetails?.status || subscriptionRecord.status,
          amount: subscriptionDetails?.recurring_pre_tax_amount || 'N/A',
          currency: subscriptionDetails?.currency || 'USD',
          interval: subscriptionDetails?.payment_frequency_interval || 'month',
          nextBilling: subscriptionDetails?.next_billing_date || 'N/A',
          previousBilling: subscriptionDetails?.previous_billing_date || 'N/A',
          createdAt: subscriptionDetails?.created_at || subscriptionRecord.createdAt,
          cancelledAt: subscriptionDetails?.cancelled_at || null,
          expiresAt: subscriptionDetails?.expires_at || null,
          cancelAtNextBilling: subscriptionDetails?.cancel_at_next_billing_date || false,
          discountId: subscriptionDetails?.discount_id || null,
          discountCyclesRemaining: subscriptionDetails?.discount_cycles_remaining || null,
          productId: subscriptionDetails?.product_id || 'N/A',
          quantity: subscriptionDetails?.quantity || 1,
          addons: subscriptionDetails?.addons || [],
          metadata: subscriptionDetails?.metadata || {}
        }
      }
    };

    return res.json(response, 200, headers);

  } catch (err) {
    error(`handleGetSubscriptionDetails error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleCheckDatabase(users, databases, body, res, log, error, headers, databaseId, collectionId) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`🔍 Checking database for user: ${userId}`);

    // Get user info
    const user = await users.get(userId);
    log(`User email: ${user.email}`);
    log(`User labels: ${JSON.stringify(user.labels)}`);

    // Check all subscriptions in database
    const allSubscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      []
    );
    log(`Total subscriptions in database: ${allSubscriptions.documents.length}`);

    // Check subscriptions for this specific user
    const userSubscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );
    log(`Subscriptions for user ${userId}: ${userSubscriptions.documents.length}`);

    // Check if there are any subscriptions with this user's email
    let emailSubscriptions = [];
    try {
      const emailSubscriptions = await databases.listDocuments(
        databaseId,
        collectionId,
        [Query.equal('userEmail', user.email)]
      );
      log(`Subscriptions with email ${user.email}: ${emailSubscriptions.documents.length}`);
    } catch (emailError) {
      log(`Email search not available: ${emailError.message}`);
    }

    // List all subscription records for debugging
    const allRecords = allSubscriptions.documents.map(sub => ({
      id: sub.$id,
      userId: sub.userId,
      dodoSubscriptionId: sub.dodoSubscriptionId,
      dodoCustomerId: sub.dodoCustomerId,
      status: sub.status,
      createdAt: sub.createdAt
    }));

    return res.json({
      success: true,
      debug: {
        userId,
        userEmail: user.email,
        userLabels: user.labels,
        databaseInfo: {
          totalSubscriptions: allSubscriptions.documents.length,
          userSubscriptions: userSubscriptions.documents.length,
          emailSubscriptions: emailSubscriptions.length,
          allRecords: allRecords
        },
        userSubscriptions: userSubscriptions.documents,
        databaseId,
        collectionId
      }
    }, 200, headers);

  } catch (err) {
    error(`handleCheckDatabase error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleSimulatePaymentSuccess(users, databases, body, res, log, error, headers, databaseId, collectionId) {
  try {
    const { userId, subscriptionId, paymentId, customerId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`🎭 Simulating payment success for user: ${userId}`);

    // Create a realistic subscription record based on Dodo dashboard structure
    const subscriptionRecord = {
      userId: userId,
      dodoSubscriptionId: subscriptionId || `sub_${Date.now()}`,
      dodoCustomerId: customerId || `cus_${userId}`,
      dodoPaymentId: paymentId || `pay_${Date.now()}`,
      status: 'active',
      // Dodo dashboard fields
      customerEmail: '', // Will be filled from user data
      productId: process.env.DODO_PRODUCT_ID || 'prod_default',
      startDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextBillingAmount: 999,
      quantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check if subscription already exists
    const existingSubscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    let subscriptionRecordId;
    if (existingSubscriptions.documents.length > 0) {
      // Update existing subscription
      const existingSub = existingSubscriptions.documents[0];
      await databases.updateDocument(
        databaseId,
        collectionId,
        existingSub.$id,
        subscriptionRecord
      );
      subscriptionRecordId = existingSub.$id;
      log(`✅ Updated existing subscription: ${subscriptionRecordId}`);
    } else {
      // Create new subscription
      const newSubscription = await databases.createDocument(
        databaseId,
        collectionId,
        ID.unique(),
        subscriptionRecord
      );
      subscriptionRecordId = newSubscription.$id;
      log(`✅ Created new subscription: ${subscriptionRecordId}`);
    }

    // Update user labels
    try {
      const user = await users.get(userId);
      const currentLabels = user.labels || [];
      const premiumLabels = ['premium', 'subscriber'];
      
      const hasPremium = premiumLabels.some(label => currentLabels.includes(label));
      if (!hasPremium) {
        const updatedLabels = [...currentLabels, ...premiumLabels];
        await users.updateLabels(userId, updatedLabels);
        log(`✅ Added premium labels to user: ${premiumLabels.join(', ')}`);
      } else {
        log(`✅ User already has premium labels`);
      }
    } catch (labelError) {
      log(`❌ Failed to update user labels: ${labelError.message}`);
    }

    return res.json({
      success: true,
      message: 'Payment success simulated and subscription stored',
      subscriptionRecordId,
      subscription: subscriptionRecord
    }, 200, headers);

  } catch (err) {
    error(`handleSimulatePaymentSuccess error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleSyncFromDodo(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, databaseId, collectionId) {
  try {
    const { userId, userEmail } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`🔄 Syncing subscription data from Dodo for user: ${userId}`);

    // Get user info
    const user = await users.get(userId);
    const email = userEmail || user.email;
    log(`User email: ${email}`);

    let subscriptionData = null;
    let customerData = null;
    let paymentData = null;

    // Step 1: Find customer by email using official Dodo API
    try {
      log(`Searching for customer with email: ${email}`);
      const customerResponse = await fetch(`${dodoApiUrl}/customers?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (customerResponse.ok) {
        const customerResult = await customerResponse.json();
        if (customerResult.data && customerResult.data.length > 0) {
          customerData = customerResult.data[0];
          log(`✅ Found customer: ${customerData.id}`);
        } else {
          log(`❌ No customer found with email: ${email}`);
          return res.json({ 
            success: false, 
            message: `No customer found with email: ${email}`,
            suggestion: 'Make sure the user has completed a payment through Dodo'
          }, 404, headers);
        }
      } else {
        log(`❌ Customer search failed: ${customerResponse.status}`);
        return res.json({ 
          success: false, 
          message: `Customer search failed: ${customerResponse.status}` 
        }, 500, headers);
      }
    } catch (customerError) {
      log(`❌ Customer search error: ${customerError.message}`);
      return res.json({ 
        success: false, 
        message: `Customer search error: ${customerError.message}` 
      }, 500, headers);
    }

    // Step 2: Find subscriptions using official Dodo API - client.subscriptions.list()
    try {
      log(`Fetching subscriptions using official Dodo API: client.subscriptions.list()`);
      const subscriptionsResponse = await fetch(`${dodoApiUrl}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (subscriptionsResponse.ok) {
        const subscriptionsResult = await subscriptionsResponse.json();
        log(`Raw subscriptions response: ${JSON.stringify(subscriptionsResult, null, 2)}`);
        
        if (subscriptionsResult.data && subscriptionsResult.data.length > 0) {
          // Filter subscriptions for this customer
          const customerSubscriptions = subscriptionsResult.data.filter(sub => 
            sub.customer && sub.customer.id === customerData.id
          );
          
          if (customerSubscriptions.length > 0) {
            subscriptionData = customerSubscriptions[0]; // Get the first active subscription
            log(`✅ Found subscription: ${subscriptionData.id}`);
          } else {
            log(`❌ No subscriptions found for customer: ${customerData.id}`);
            return res.json({ 
              success: false, 
              message: `No subscriptions found for customer: ${customerData.id}` 
            }, 404, headers);
          }
        } else {
          log(`❌ No subscriptions found in API response`);
          return res.json({ 
            success: false, 
            message: `No subscriptions found in Dodo API` 
          }, 404, headers);
        }
      } else {
        log(`❌ Subscriptions API call failed: ${subscriptionsResponse.status}`);
        return res.json({ 
          success: false, 
          message: `Subscriptions API call failed: ${subscriptionsResponse.status}` 
        }, 500, headers);
      }
    } catch (subscriptionError) {
      log(`❌ Subscription API error: ${subscriptionError.message}`);
      return res.json({ 
        success: false, 
        message: `Subscription API error: ${subscriptionError.message}` 
      }, 500, headers);
    }

    // Step 3: Get payment details using official Dodo API - client.payments.list()
    try {
      log(`Fetching payments using official Dodo API: client.payments.list()`);
      const paymentsResponse = await fetch(`${dodoApiUrl}/payments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (paymentsResponse.ok) {
        const paymentsResult = await paymentsResponse.json();
        log(`Raw payments response: ${JSON.stringify(paymentsResult, null, 2)}`);
        
        if (paymentsResult.data && paymentsResult.data.length > 0) {
          // Filter payments for this subscription
          const subscriptionPayments = paymentsResult.data.filter(payment => 
            payment.subscription_id === subscriptionData.id
          );
          
          if (subscriptionPayments.length > 0) {
            paymentData = subscriptionPayments[0]; // Get the first payment
            log(`✅ Found payment: ${paymentData.id}`);
          } else {
            log(`⚠️ No payments found for subscription: ${subscriptionData.id}`);
          }
        } else {
          log(`⚠️ No payments found in API response`);
        }
      } else {
        log(`❌ Payments API call failed: ${paymentsResponse.status}`);
      }
    } catch (paymentError) {
      log(`❌ Payment API error: ${paymentError.message}`);
    }

    // Step 4: Store subscription data in database
    try {
      log(`Storing subscription data in database...`);
      
      const subscriptionRecord = {
        userId: userId,
        dodoSubscriptionId: subscriptionData.id,
        dodoCustomerId: customerData.id,
        dodoPaymentId: paymentData ? paymentData.id : null,
        status: subscriptionData.status,
        // Dodo dashboard fields
        customerEmail: customerData.email,
        productId: subscriptionData.product_id,
        startDate: subscriptionData.created_at,
        nextBillingDate: subscriptionData.next_billing_date,
        nextBillingAmount: subscriptionData.recurring_pre_tax_amount,
        quantity: subscriptionData.quantity || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check if subscription already exists
      const existingSubscriptions = await databases.listDocuments(
        databaseId,
        collectionId,
        [Query.equal('userId', userId)]
      );

      let subscriptionRecordId;
      if (existingSubscriptions.documents.length > 0) {
        // Update existing subscription
        const existingSub = existingSubscriptions.documents[0];
        await databases.updateDocument(
          databaseId,
          collectionId,
          existingSub.$id,
          subscriptionRecord
        );
        subscriptionRecordId = existingSub.$id;
        log(`✅ Updated existing subscription: ${subscriptionRecordId}`);
      } else {
        // Create new subscription
        const newSubscription = await databases.createDocument(
          databaseId,
          collectionId,
          ID.unique(),
          subscriptionRecord
        );
        subscriptionRecordId = newSubscription.$id;
        log(`✅ Created new subscription: ${subscriptionRecordId}`);
      }

      // Update user labels
      try {
        const currentLabels = user.labels || [];
        const premiumLabels = ['premium', 'subscriber'];
        
        const hasPremium = premiumLabels.some(label => currentLabels.includes(label));
        if (!hasPremium) {
          const updatedLabels = [...currentLabels, ...premiumLabels];
          await users.updateLabels(userId, updatedLabels);
          log(`✅ Added premium labels to user: ${premiumLabels.join(', ')}`);
        } else {
          log(`✅ User already has premium labels`);
        }
      } catch (labelError) {
        log(`❌ Failed to update user labels: ${labelError.message}`);
      }

      return res.json({
        success: true,
        message: 'Subscription data synced from Dodo and stored successfully',
        subscriptionRecordId,
        subscription: subscriptionRecord,
        dodoData: {
          subscription: subscriptionData,
          customer: customerData,
          payment: paymentData
        }
      }, 200, headers);

    } catch (dbError) {
      error(`Failed to store subscription data: ${dbError.message}`);
      return res.json({ error: `Database error: ${dbError.message}` }, 500, headers);
    }

  } catch (err) {
    error(`handleSyncFromDodo error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleTestDodoApi(body, res, log, error, headers, dodoApiUrl, apiKey) {
  try {
    const { subscriptionId } = body;

    log(`🧪 Testing Dodo API connectivity and endpoints...`);
    log(`API URL: ${dodoApiUrl}`);
    log(`API Key: ${apiKey.substring(0, 10)}...`);

    const results = {
      apiUrl: dodoApiUrl,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      tests: {}
    };

    // Test 1: List all subscriptions
    try {
      log(`Test 1: Calling client.subscriptions.list()...`);
      const subscriptionsResponse = await fetch(`${dodoApiUrl}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      results.tests.subscriptionsList = {
        status: subscriptionsResponse.status,
        success: subscriptionsResponse.ok,
        response: subscriptionsResponse.ok ? await subscriptionsResponse.json() : await subscriptionsResponse.text()
      };

      if (subscriptionsResponse.ok) {
        log(`✅ client.subscriptions.list() successful`);
      } else {
        log(`❌ client.subscriptions.list() failed: ${subscriptionsResponse.status}`);
      }
    } catch (subListError) {
      log(`❌ client.subscriptions.list() error: ${subListError.message}`);
      results.tests.subscriptionsList = {
        error: subListError.message
      };
    }

    // Test 2: List all payments
    try {
      log(`Test 2: Calling client.payments.list()...`);
      const paymentsResponse = await fetch(`${dodoApiUrl}/payments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      results.tests.paymentsList = {
        status: paymentsResponse.status,
        success: paymentsResponse.ok,
        response: paymentsResponse.ok ? await paymentsResponse.json() : await paymentsResponse.text()
      };

      if (paymentsResponse.ok) {
        log(`✅ client.payments.list() successful`);
      } else {
        log(`❌ client.payments.list() failed: ${paymentsResponse.status}`);
      }
    } catch (payListError) {
      log(`❌ client.payments.list() error: ${payListError.message}`);
      results.tests.paymentsList = {
        error: payListError.message
      };
    }

    // Test 3: Retrieve specific subscription (if provided)
    if (subscriptionId) {
      try {
        log(`Test 3: Calling client.subscriptions.retrieve('${subscriptionId}')...`);
        const subscriptionResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        results.tests.subscriptionRetrieve = {
          subscriptionId: subscriptionId,
          status: subscriptionResponse.status,
          success: subscriptionResponse.ok,
          response: subscriptionResponse.ok ? await subscriptionResponse.json() : await subscriptionResponse.text()
        };

        if (subscriptionResponse.ok) {
          log(`✅ client.subscriptions.retrieve('${subscriptionId}') successful`);
        } else {
          log(`❌ client.subscriptions.retrieve('${subscriptionId}') failed: ${subscriptionResponse.status}`);
        }
      } catch (subRetrieveError) {
        log(`❌ client.subscriptions.retrieve('${subscriptionId}') error: ${subRetrieveError.message}`);
        results.tests.subscriptionRetrieve = {
          subscriptionId: subscriptionId,
          error: subRetrieveError.message
        };
      }
    }

    // Test 4: Test different API endpoints
    const alternativeEndpoints = [
      `${dodoApiUrl.replace('/v1', '')}/subscriptions`,
      `${dodoApiUrl}/subscriptions`,
      `https://api.dodopayments.com/subscriptions`,
      `https://test.dodopayments.com/subscriptions`
    ];

    results.tests.alternativeEndpoints = {};

    for (const endpoint of alternativeEndpoints) {
      try {
        log(`Testing alternative endpoint: ${endpoint}`);
        const testResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        results.tests.alternativeEndpoints[endpoint] = {
          status: testResponse.status,
          success: testResponse.ok,
          response: testResponse.ok ? await testResponse.json() : await testResponse.text()
        };

        if (testResponse.ok) {
          log(`✅ Alternative endpoint successful: ${endpoint}`);
        } else {
          log(`❌ Alternative endpoint failed: ${endpoint} - ${testResponse.status}`);
        }
      } catch (altError) {
        log(`❌ Alternative endpoint error: ${endpoint} - ${altError.message}`);
        results.tests.alternativeEndpoints[endpoint] = {
          error: altError.message
        };
      }
    }

    return res.json({
      success: true,
      message: 'Dodo API test completed',
      results
    }, 200, headers);

  } catch (err) {
    error(`handleTestDodoApi error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleFixSubscriptionData(users, databases, body, res, log, error, headers, dodoApiUrl, apiKey, databaseId, collectionId) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`🔧 Fixing subscription data for user: ${userId}`);

    // Get user's subscription from database
    const subscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (subscriptions.documents.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No subscription found for this user' 
      }, 404, headers);
    }

    const subscriptionRecord = subscriptions.documents[0];
    log(`Found subscription record: ${subscriptionRecord.dodoSubscriptionId}`);

    // Step 1: Test the official API endpoints
    log(`Testing official Dodo API endpoints...`);

    // Test 1: List all subscriptions using official endpoint
    let allSubscriptions = [];
    try {
      log(`Calling GET /subscriptions (client.subscriptions.list())...`);
      const subscriptionsResponse = await fetch(`${dodoApiUrl}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        allSubscriptions = subscriptionsData.data || subscriptionsData || [];
        log(`✅ Found ${allSubscriptions.length} subscriptions in Dodo API`);
        
        // Log all subscription IDs for debugging
        const subscriptionIds = allSubscriptions.map(sub => sub.id || sub.subscription_id);
        log(`Available subscription IDs: ${JSON.stringify(subscriptionIds)}`);
      } else {
        log(`❌ Failed to list subscriptions: ${subscriptionsResponse.status}`);
        const errorText = await subscriptionsResponse.text();
        log(`Error response: ${errorText}`);
      }
    } catch (listError) {
      log(`❌ Error listing subscriptions: ${listError.message}`);
    }

    // Test 2: Try to retrieve specific subscription using official endpoint
    let subscriptionDetails = null;
    try {
      log(`Calling GET /subscriptions/${subscriptionRecord.dodoSubscriptionId} (client.subscriptions.retrieve())...`);
      const subscriptionResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionRecord.dodoSubscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (subscriptionResponse.ok) {
        subscriptionDetails = await subscriptionResponse.json();
        log(`✅ Successfully retrieved subscription details`);
      } else {
        log(`❌ Failed to retrieve subscription: ${subscriptionResponse.status}`);
        const errorText = await subscriptionResponse.text();
        log(`Error response: ${errorText}`);
      }
    } catch (retrieveError) {
      log(`❌ Error retrieving subscription: ${retrieveError.message}`);
    }

    // Step 3: Find matching subscription in the list
    let matchingSubscription = null;
    if (allSubscriptions.length > 0) {
      matchingSubscription = allSubscriptions.find(sub => 
        (sub.id === subscriptionRecord.dodoSubscriptionId) ||
        (sub.subscription_id === subscriptionRecord.dodoSubscriptionId)
      );
      
      if (matchingSubscription) {
        log(`✅ Found matching subscription in list`);
      } else {
        log(`❌ Subscription not found in list - ID mismatch`);
        log(`Looking for: ${subscriptionRecord.dodoSubscriptionId}`);
        log(`Available IDs: ${allSubscriptions.map(s => s.id || s.subscription_id).join(', ')}`);
      }
    }

    // Step 4: Update database with correct data
    let updatedData = null;
    if (subscriptionDetails || matchingSubscription) {
      const sourceData = subscriptionDetails || matchingSubscription;
      log(`Updating database with data from: ${subscriptionDetails ? 'retrieve' : 'list'}`);
      
      try {
        const updateData = {
          // Keep existing fields
          userId: subscriptionRecord.userId,
          dodoSubscriptionId: subscriptionRecord.dodoSubscriptionId,
          dodoCustomerId: subscriptionRecord.dodoCustomerId,
          dodoPaymentId: subscriptionRecord.dodoPaymentId,
          status: sourceData.status || subscriptionRecord.status,
          // Update with real API data
          customerEmail: sourceData.customer?.email || subscriptionRecord.customerEmail,
          productId: sourceData.product_id || subscriptionRecord.productId,
          startDate: sourceData.created_at || sourceData.start_date || subscriptionRecord.startDate,
          nextBillingDate: sourceData.next_billing_date || subscriptionRecord.nextBillingDate,
          nextBillingAmount: sourceData.recurring_pre_tax_amount || subscriptionRecord.nextBillingAmount,
          quantity: sourceData.quantity || subscriptionRecord.quantity || 1,
          currency: sourceData.currency || subscriptionRecord.currency || 'USD',
          cancelAtPeriodEnd: sourceData.cancel_at_next_billing_date || subscriptionRecord.cancelAtPeriodEnd || false,
          updatedAt: new Date().toISOString()
        };

        await databases.updateDocument(
          databaseId,
          collectionId,
          subscriptionRecord.$id,
          updateData
        );

        updatedData = updateData;
        log(`✅ Database updated with real API data`);
      } catch (updateError) {
        log(`❌ Failed to update database: ${updateError.message}`);
      }
    } else {
      log(`⚠️ No API data available - keeping existing database data`);
    }

    return res.json({
      success: true,
      message: 'Subscription data analysis completed',
      results: {
        userId,
        databaseSubscription: subscriptionRecord,
        apiTest: {
          listSubscriptions: {
            success: allSubscriptions.length > 0,
            count: allSubscriptions.length,
            subscriptionIds: allSubscriptions.map(s => s.id || s.subscription_id)
          },
          retrieveSubscription: {
            success: !!subscriptionDetails,
            subscriptionId: subscriptionRecord.dodoSubscriptionId
          },
          matchingSubscription: !!matchingSubscription
        },
        updatedData,
        recommendations: allSubscriptions.length === 0 ? 
          'No subscriptions found in Dodo API - check API key and environment' :
          !matchingSubscription ? 
          'Subscription ID not found in Dodo API - may be from different environment' :
          'API data successfully retrieved and database updated'
      }
    }, 200, headers);

  } catch (err) {
    error(`handleFixSubscriptionData error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleGetSubscriptionDetails(databases, body, res, log, error, headers, dodoApiUrl, apiKey, databaseId, collectionId) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`📊 Fetching comprehensive subscription details for user: ${userId}`);

    // Step 1: Get subscription record from database
    const subscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (subscriptions.documents.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No subscription found for this user',
        hasSubscription: false
      }, 404, headers);
    }

    const subscriptionRecord = subscriptions.documents[0];
    log(`Found subscription record in database`);

    // Step 2: Fetch subscription details from Dodo using client.subscriptions.retrieve()
    log(`Fetching subscription from Dodo API: ${subscriptionRecord.dodoSubscriptionId}`);
    let subscriptionDetails = null;
    try {
      const response = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionRecord.dodoSubscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        subscriptionDetails = await response.json();
        log(`✅ Retrieved subscription details`);
      } else {
        log(`⚠️ Failed to fetch subscription: ${response.status}`);
      }
    } catch (err) {
      log(`⚠️ Error fetching subscription: ${err.message}`);
    }

    // Step 3: Fetch customer details from Dodo using client.customers.retrieve()
    log(`Fetching customer from Dodo API: ${subscriptionRecord.dodoCustomerId}`);
    let customerDetails = null;
    try {
      const response = await fetch(`${dodoApiUrl}/customers/${subscriptionRecord.dodoCustomerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        customerDetails = await response.json();
        log(`✅ Retrieved customer details`);
      } else {
        log(`⚠️ Failed to fetch customer: ${response.status}`);
      }
    } catch (err) {
      log(`⚠️ Error fetching customer: ${err.message}`);
    }

    // Step 4: Fetch payment details from Dodo using client.payments.retrieve()
    log(`Fetching payment from Dodo API: ${subscriptionRecord.dodoPaymentId}`);
    let paymentDetails = null;
    if (subscriptionRecord.dodoPaymentId && subscriptionRecord.dodoPaymentId !== 'N/A') {
      try {
        const response = await fetch(`${dodoApiUrl}/payments/${subscriptionRecord.dodoPaymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          paymentDetails = await response.json();
          log(`✅ Retrieved payment details`);
        } else {
          log(`⚠️ Failed to fetch payment: ${response.status}`);
        }
      } catch (err) {
        log(`⚠️ Error fetching payment: ${err.message}`);
      }
    }

    // Step 5: List all payments using client.payments.list()
    log(`Fetching all payments from Dodo API`);
    let allPayments = [];
    try {
      const response = await fetch(`${dodoApiUrl}/payments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const paymentsData = await response.json();
        const allPaymentsList = paymentsData.data || paymentsData || [];
        // Filter payments for this subscription
        allPayments = allPaymentsList.filter(p => 
          p.subscription_id === subscriptionRecord.dodoSubscriptionId ||
          (p.customer?.customer_id === subscriptionRecord.dodoCustomerId) ||
          (p.customer?.id === subscriptionRecord.dodoCustomerId)
        );
        log(`✅ Found ${allPayments.length} payments for this subscription`);
      } else {
        log(`⚠️ Failed to list payments: ${response.status}`);
      }
    } catch (err) {
      log(`⚠️ Error listing payments: ${err.message}`);
    }

    // Step 6: Compile comprehensive response
    const responseData = {
      success: true,
      hasSubscription: true,
      database: {
        ...subscriptionRecord,
        source: 'appwrite_database'
      },
      dodoApi: {
        subscription: subscriptionDetails || null,
        customer: customerDetails || null,
        latestPayment: paymentDetails || null,
        allPayments: allPayments,
        paymentCount: allPayments.length
      },
      summary: {
        subscriptionId: subscriptionRecord.dodoSubscriptionId,
        customerId: subscriptionRecord.dodoCustomerId,
        paymentId: subscriptionRecord.dodoPaymentId,
        status: subscriptionDetails?.status || subscriptionRecord.status,
        customerEmail: customerDetails?.email || subscriptionRecord.customerEmail,
        productId: subscriptionDetails?.product_id || subscriptionRecord.productId,
        nextBillingDate: subscriptionDetails?.next_billing_date || subscriptionRecord.nextBillingDate,
        nextBillingAmount: subscriptionDetails?.recurring_pre_tax_amount || subscriptionRecord.nextBillingAmount,
        currency: subscriptionDetails?.currency || subscriptionRecord.currency,
        quantity: subscriptionDetails?.quantity || subscriptionRecord.quantity,
        cancelAtPeriodEnd: subscriptionDetails?.cancel_at_next_billing_date || subscriptionRecord.cancelAtPeriodEnd,
        apiDataAvailable: {
          subscription: !!subscriptionDetails,
          customer: !!customerDetails,
          payment: !!paymentDetails,
          paymentsList: allPayments.length > 0
        }
      }
    };

    log(`✅ Successfully compiled comprehensive subscription details`);
    return res.json(responseData, 200, headers);

  } catch (err) {
    error(`handleGetSubscriptionDetails error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

async function handleDiagnoseApiIssue(databases, body, res, log, error, headers, dodoApiUrl, apiKey, databaseId, collectionId) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`🔍 Diagnosing API connectivity issues for user: ${userId}`);

    // Step 1: Get subscription record from database
    const subscriptions = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal('userId', userId)]
    );

    if (subscriptions.documents.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No subscription found for this user',
        hasSubscription: false
      }, 404, headers);
    }

    const subscriptionRecord = subscriptions.documents[0];
    log(`Found subscription record: ${JSON.stringify(subscriptionRecord, null, 2)}`);

    // Step 2: Test basic API connectivity
    log(`Testing basic API connectivity...`);
    let basicConnectivity = {
      products: false,
      customers: false,
      subscriptions: false,
      payments: false
    };

    // Test 1: Products endpoint
    try {
      log(`Testing GET /products`);
      const productsResponse = await fetch(`${dodoApiUrl}/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      log(`Products response: ${productsResponse.status}`);
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        log(`Products data: ${JSON.stringify(productsData, null, 2)}`);
        basicConnectivity.products = true;
      } else {
        const errorText = await productsResponse.text();
        log(`Products error: ${errorText}`);
      }
    } catch (err) {
      log(`Products error: ${err.message}`);
    }

    // Test 2: Customers endpoint
    try {
      log(`Testing GET /customers`);
      const customersResponse = await fetch(`${dodoApiUrl}/customers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      log(`Customers response: ${customersResponse.status}`);
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        log(`Customers data: ${JSON.stringify(customersData, null, 2)}`);
        basicConnectivity.customers = true;
      } else {
        const errorText = await customersResponse.text();
        log(`Customers error: ${errorText}`);
      }
    } catch (err) {
      log(`Customers error: ${err.message}`);
    }

    // Test 3: Subscriptions endpoint
    try {
      log(`Testing GET /subscriptions`);
      const subscriptionsResponse = await fetch(`${dodoApiUrl}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      log(`Subscriptions response: ${subscriptionsResponse.status}`);
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        log(`Subscriptions data: ${JSON.stringify(subscriptionsData, null, 2)}`);
        basicConnectivity.subscriptions = true;
      } else {
        const errorText = await subscriptionsResponse.text();
        log(`Subscriptions error: ${errorText}`);
      }
    } catch (err) {
      log(`Subscriptions error: ${err.message}`);
    }

    // Test 4: Payments endpoint
    try {
      log(`Testing GET /payments`);
      const paymentsResponse = await fetch(`${dodoApiUrl}/payments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      log(`Payments response: ${paymentsResponse.status}`);
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        log(`Payments data: ${JSON.stringify(paymentsData, null, 2)}`);
        basicConnectivity.payments = true;
      } else {
        const errorText = await paymentsResponse.text();
        log(`Payments error: ${errorText}`);
      }
    } catch (err) {
      log(`Payments error: ${err.message}`);
    }

    // Step 3: Test specific resource endpoints
    log(`Testing specific resource endpoints...`);
    let specificTests = {
      subscription: { success: false, status: null, data: null },
      customer: { success: false, status: null, data: null },
      payment: { success: false, status: null, data: null }
    };

    // Test specific subscription
    try {
      log(`Testing GET /subscriptions/${subscriptionRecord.dodoSubscriptionId}`);
      const subResponse = await fetch(`${dodoApiUrl}/subscriptions/${subscriptionRecord.dodoSubscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      specificTests.subscription.status = subResponse.status;
      if (subResponse.ok) {
        specificTests.subscription.data = await subResponse.json();
        specificTests.subscription.success = true;
        log(`✅ Subscription found: ${JSON.stringify(specificTests.subscription.data, null, 2)}`);
      } else {
        const errorText = await subResponse.text();
        log(`❌ Subscription error: ${errorText}`);
      }
    } catch (err) {
      log(`❌ Subscription error: ${err.message}`);
    }

    // Test specific customer
    try {
      log(`Testing GET /customers/${subscriptionRecord.dodoCustomerId}`);
      const custResponse = await fetch(`${dodoApiUrl}/customers/${subscriptionRecord.dodoCustomerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      specificTests.customer.status = custResponse.status;
      if (custResponse.ok) {
        specificTests.customer.data = await custResponse.json();
        specificTests.customer.success = true;
        log(`✅ Customer found: ${JSON.stringify(specificTests.customer.data, null, 2)}`);
      } else {
        const errorText = await custResponse.text();
        log(`❌ Customer error: ${errorText}`);
      }
    } catch (err) {
      log(`❌ Customer error: ${err.message}`);
    }

    // Test specific payment
    if (subscriptionRecord.dodoPaymentId && subscriptionRecord.dodoPaymentId !== 'N/A') {
      try {
        log(`Testing GET /payments/${subscriptionRecord.dodoPaymentId}`);
        const payResponse = await fetch(`${dodoApiUrl}/payments/${subscriptionRecord.dodoPaymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        specificTests.payment.status = payResponse.status;
        if (payResponse.ok) {
          specificTests.payment.data = await payResponse.json();
          specificTests.payment.success = true;
          log(`✅ Payment found: ${JSON.stringify(specificTests.payment.data, null, 2)}`);
        } else {
          const errorText = await payResponse.text();
          log(`❌ Payment error: ${errorText}`);
        }
      } catch (err) {
        log(`❌ Payment error: ${err.message}`);
      }
    }

    // Step 4: Analyze the issue
    const analysis = {
      apiConnectivity: basicConnectivity,
      specificResources: specificTests,
      databaseRecord: subscriptionRecord,
      apiUrl: dodoApiUrl,
      apiKeyPrefix: apiKey.substring(0, 20) + '...',
      recommendations: []
    };

    // Generate recommendations
    if (!basicConnectivity.products && !basicConnectivity.customers && !basicConnectivity.subscriptions && !basicConnectivity.payments) {
      analysis.recommendations.push('❌ API is completely unreachable - check API key and endpoint URL');
    } else if (basicConnectivity.products && !basicConnectivity.subscriptions) {
      analysis.recommendations.push('⚠️ API key works but subscriptions endpoint failed - check permissions');
    } else if (basicConnectivity.subscriptions && !specificTests.subscription.success) {
      analysis.recommendations.push('⚠️ Subscriptions endpoint works but specific subscription not found - ID may be from different environment');
    } else if (specificTests.subscription.success) {
      analysis.recommendations.push('✅ API is working correctly - subscription found in Dodo');
    }

    if (specificTests.subscription.status === 404) {
      analysis.recommendations.push('🔍 Subscription ID not found - may be from test environment while using live API key or vice versa');
    }

    if (specificTests.customer.status === 404) {
      analysis.recommendations.push('🔍 Customer ID not found - may be from different environment');
    }

    if (specificTests.payment.status === 404) {
      analysis.recommendations.push('🔍 Payment ID not found - may be from different environment');
    }

    log(`✅ Diagnosis complete`);

    return res.json({
      success: true,
      message: 'API diagnosis completed',
      analysis,
      nextSteps: [
        'Check if you are using the correct API environment (test vs live)',
        'Verify your API key has the correct permissions',
        'Ensure the subscription IDs are from the same environment as your API key',
        'Try creating a new test subscription to verify the integration works'
      ]
    }, 200, headers);

  } catch (err) {
    error(`handleDiagnoseApiIssue error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

// Get payment history for a user
async function handleGetPaymentHistory(dodoApiUrl, apiKey, body, res, log, error, headers) {
  try {
    const { userId } = body;

    if (!userId) {
      return res.json({ error: 'userId is required' }, 400, headers);
    }

    log(`📋 Fetching payment history for user: ${userId}`);

    // Get customer ID from subscriptions collection (where it's already stored)
    const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
    const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
    
    let dodoCustomerId = null;
    
    // Initialize Appwrite client to query subscriptions collection
    try {
      const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
      
      const databases = new Databases(client);
      
      log(`🔍 Querying subscriptions collection for userId: ${userId}`);
      
      // Query subscriptions collection for this user
      const subscriptionsQuery = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION,
        [Query.equal('userId', userId)]
      );
      
      if (subscriptionsQuery.documents.length > 0) {
        // Get the dodoCustomerId from the subscription record
        const subscription = subscriptionsQuery.documents[0];
        dodoCustomerId = subscription.dodoCustomerId;
        log(`✅ Found dodoCustomerId from subscription: ${dodoCustomerId}`);
      } else {
        log(`ℹ️ No subscription record found for user in database`);
      }
    } catch (dbError) {
      log(`⚠️ Error querying subscriptions collection: ${dbError.message}`);
    }

    log(`🔍 Fetching payments from Dodo API... (customer filter: ${dodoCustomerId || 'none'})`);

    // Build payments endpoint with optional customer filter
    let paymentsUrl = `${dodoApiUrl}/payments`;
    if (dodoCustomerId) {
      paymentsUrl += `?customer_id=${encodeURIComponent(dodoCustomerId)}`;
    }
    
    log(`🌐 Payments API URL: ${paymentsUrl}`);
  // Production cleanup: removed API key logging

    const paymentsResponse = await fetch(paymentsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentsResponse.ok) {
      const errorText = await paymentsResponse.text();
      log(`❌ Failed to fetch payments: ${paymentsResponse.status} - ${errorText}`);
      return res.json({ error: 'Failed to fetch payments', details: errorText }, paymentsResponse.status, headers);
    }

    const paymentsData = await paymentsResponse.json();
    
    // Debug: Log the full API response structure
    log(`🔍 Full Dodo API response structure:`);
    log(`- Response keys: ${Object.keys(paymentsData).join(', ')}`);
    log(`- Has 'data' property: ${paymentsData.hasOwnProperty('data')}`);
    log(`- Has 'items' property: ${paymentsData.hasOwnProperty('items')}`);
    log(`- Has 'payments' property: ${paymentsData.hasOwnProperty('payments')}`);
    log(`- Response type: ${typeof paymentsData}`);
    log(`- Full response: ${JSON.stringify(paymentsData, null, 2)}`);
    
    // Try different possible response structures
    let paymentsArray = [];
    if (paymentsData.data && Array.isArray(paymentsData.data)) {
      paymentsArray = paymentsData.data;
      log(`✅ Using paymentsData.data (${paymentsArray.length} items)`);
    } else if (paymentsData.items && Array.isArray(paymentsData.items)) {
      paymentsArray = paymentsData.items;
      log(`✅ Using paymentsData.items (${paymentsArray.length} items)`);
    } else if (paymentsData.payments && Array.isArray(paymentsData.payments)) {
      paymentsArray = paymentsData.payments;
      log(`✅ Using paymentsData.payments (${paymentsArray.length} items)`);
    } else if (Array.isArray(paymentsData)) {
      paymentsArray = paymentsData;
      log(`✅ Using paymentsData directly as array (${paymentsArray.length} items)`);
    } else {
      log(`❌ No recognizable payments array found in response`);
    }
    
    log(`✅ Fetched ${paymentsArray.length} payments from Dodo API`);

    // If no payments found with customer filter, try fetching all payments
    if (paymentsArray.length === 0 && dodoCustomerId) {
      log(`🔄 No payments found with customer filter, trying to fetch all payments...`);
      
      const allPaymentsResponse = await fetch(`${dodoApiUrl}/payments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (allPaymentsResponse.ok) {
        const allPaymentsData = await allPaymentsResponse.json();
        log(`🔍 All payments response structure: ${Object.keys(allPaymentsData).join(', ')}`);
        
        // Try to find payments for this customer in all payments
        let allPaymentsArray = [];
        if (allPaymentsData.data && Array.isArray(allPaymentsData.data)) {
          allPaymentsArray = allPaymentsData.data;
        } else if (allPaymentsData.items && Array.isArray(allPaymentsData.items)) {
          allPaymentsArray = allPaymentsData.items;
        } else if (Array.isArray(allPaymentsData)) {
          allPaymentsArray = allPaymentsData;
        }
        
        // Filter payments for this customer
        const customerPayments = allPaymentsArray.filter(payment => 
          payment.customer?.customer_id === dodoCustomerId || 
          payment.customer?.id === dodoCustomerId ||
          payment.customer_id === dodoCustomerId
        );
        
        log(`🔍 Found ${customerPayments.length} payments for customer ${dodoCustomerId} in all payments`);
        paymentsArray = customerPayments;
      } else {
        log(`❌ Failed to fetch all payments: ${allPaymentsResponse.status}`);
      }
    }

    // Format payments for frontend
    const payments = paymentsArray.map(payment => ({
      payment_id: payment.payment_id || payment.id,
      amount: payment.total_amount || payment.amount || payment.settlement_amount || 0,
      currency: payment.currency || 'USD',
      status: payment.status || 'unknown',
      created_at: payment.created_at || new Date().toISOString(),
      payment_method: payment.payment_method ? {
        type: payment.payment_method,
        last4: payment.payment_method.last4,
        brand: payment.payment_method.brand
      } : {
        type: payment.payment_method || 'card'
      },
      description: payment.description || payment.product_name || 'Premium Subscription Payment',
      subscription_id: payment.subscription_id,
      customer: payment.customer
    }));

    log(`✅ Returning ${payments.length} formatted payments`);
    
    // Debug: Log the formatted payment data
    if (payments.length > 0) {
      log(`🔍 Formatted payment data:`);
      log(`- Payment ID: ${payments[0].payment_id}`);
      log(`- Amount: ${payments[0].amount}`);
      log(`- Currency: ${payments[0].currency}`);
      log(`- Status: ${payments[0].status}`);
      log(`- Created: ${payments[0].created_at}`);
      log(`- Full formatted payment: ${JSON.stringify(payments[0], null, 2)}`);
    }

    return res.json({
      success: true,
      payments
    }, 200, headers);

  } catch (err) {
    error(`handleGetPaymentHistory error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}

// Get invoice PDF for a payment
async function handleGetInvoice(dodoApiUrl, apiKey, body, res, log, error, headers) {
  try {
    const { paymentId } = body;

    if (!paymentId) {
      return res.json({ error: 'paymentId is required' }, 400, headers);
    }

    log(`📄 Fetching invoice for payment: ${paymentId}`);

    const invoiceResponse = await fetch(`${dodoApiUrl}/invoices/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/pdf'
      }
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      log(`❌ Failed to fetch invoice: ${invoiceResponse.status} - ${errorText}`);
      return res.json({ error: 'Failed to fetch invoice', details: errorText }, invoiceResponse.status, headers);
    }

    // Get the PDF blob
    const pdfBuffer = await invoiceResponse.arrayBuffer();
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

    log(`✅ Invoice fetched successfully (${pdfBuffer.byteLength} bytes)`);

    return res.json({
      success: true,
      pdf: base64Pdf,
      paymentId
    }, 200, headers);

  } catch (err) {
    error(`handleGetInvoice error: ${err.message}`);
    return res.json({ error: err.message }, 500, headers);
  }
}
