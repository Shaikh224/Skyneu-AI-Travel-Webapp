const { Client, Databases, Users, Query, ID } = require('node-appwrite');
const crypto = require('crypto');
const fetch = require('node-fetch');

// Webhook signature verification using Standard Webhooks library approach
function verifyWebhookSignature(rawBody, headers, secret) {
  if (!secret) {
    console.log('Warning: No webhook secret configured, skipping signature verification');
    return true; // Allow if no secret is configured
  }
  
  try {
    const { 'webhook-id': webhookId, 'webhook-signature': signature, 'webhook-timestamp': timestamp } = headers;
    
    if (!webhookId || !signature || !timestamp) {
      console.error('Missing required webhook headers');
      return false;
    }
    
    // Create the signed payload: webhook-id.webhook-timestamp.rawBody
    const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;
    
    // Calculate HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signedPayload);
    const calculatedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return false;
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

// Simple function to upgrade user to premium (labels only)
async function upgradeUserToPremium(users, userId, log, error) {
  try {
    log(`=== UPGRADING USER TO PREMIUM ===`);
    log(`User ID: ${userId}`);

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
    
    return true;
  } catch (err) {
    error(`❌ Failed to upgrade user to premium: ${err.message}`);
    error(`Error stack: ${err.stack}`);
    return false;
  }
}

module.exports = async ({ req, res, log, error }) => {
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

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  
  const users = new Users(client);

  try {
    // Parse request body
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

    // Route to webhook handler
    if (path === '/webhook' || path.includes('webhook')) {
      return await handleWebhook(req, users, log, error, res, headers);
    }
    
    // Test endpoint
    if (path === '/test-webhook') {
      return await handleTestWebhook(req, res, log, error, headers);
    }

    return res.json({ error: 'Invalid action or path' }, 400, headers);
  } catch (err) {
    error(`Error: ${err.message}`);
    error(err.stack);
    return res.json({ error: err.message }, 500, headers);
  }
};

async function handleWebhook(req, users, log, error, res, headers) {
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
        await handlePaymentSucceeded(users, data, log, error);
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

async function handlePaymentSucceeded(users, data, log, error) {
  try {
    log(`=== PROCESSING PAYMENT SUCCEEDED EVENT ===`);
    
    // Extract user ID from payment data
    const userId = extractUserIdFromWebhookData(data, log);
    
    if (!userId) {
      error('❌ No Appwrite user ID found in payment data');
      return;
    }

    log(`✅ Found userId: ${userId}`);
    await upgradeUserToPremium(users, userId, log, error);
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
    await upgradeUserToPremium(users, userId, log, error);
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
    await upgradeUserToPremium(users, userId, log, error);
  } catch (err) {
    error(`handleSubscriptionRenewed error: ${err.message}`);
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
