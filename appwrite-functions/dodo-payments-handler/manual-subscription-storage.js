const fetch = require('node-fetch');

// Script to manually store subscription_id for testing
async function manualSubscriptionStorage() {
  const functionUrl = 'https://68f64c110030c0eaabd9.fra.appwrite.run';
  const userId = '686a52450002cadfb696';
  
  console.log('🔧 Manual subscription ID storage for testing...');
  console.log(`Function URL: ${functionUrl}`);
  console.log(`User ID: ${userId}`);
  
  // We need to find a real subscription ID from Dodo API
  // For now, let's use a test subscription ID
  const testSubscriptionId = 'sub_test_12345';
  
  try {
    // First, let's try to get the user's preferences and update them
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'manual-upgrade',
        userId: userId,
        subscriptionId: testSubscriptionId
      })
    });
    
    console.log(`\n📊 Manual Storage Response Status: ${response.status}`);
    const data = await response.json();
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\n✅ Successfully stored subscription ID: ${testSubscriptionId}`);
      console.log(`💡 Now try the get-subscription endpoint again`);
    } else {
      console.log(`\n❌ Failed to store subscription ID`);
    }
    
  } catch (error) {
    console.error('❌ Manual storage failed:', error.message);
  }
}

manualSubscriptionStorage();
