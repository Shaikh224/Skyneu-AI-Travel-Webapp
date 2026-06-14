const { Client, Databases } = require('node-appwrite');

module.exports = async function (req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Appwrite-Project, X-Appwrite-Key, X-Appwrite-JWT');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Log authentication headers for debugging
    console.log('🔐 Authentication headers received:');
    console.log('   Project ID:', req.headers['x-appwrite-project']);
    console.log('   API Key present:', !!req.headers['x-appwrite-key']);
    console.log('   JWT present:', !!req.headers['x-appwrite-jwt']);

    const { 
      endpoint, 
      params, 
      apiKey 
    } = req.body;

    // Validate Appwrite authentication
    if (!req.headers['x-appwrite-project'] || !req.headers['x-appwrite-key']) {
      console.error('❌ Missing Appwrite authentication headers');
      return res.json({
        success: false,
        error: 'Missing Appwrite authentication headers',
        required: ['X-Appwrite-Project', 'X-Appwrite-Key'],
        received: {
          project: !!req.headers['x-appwrite-project'],
          key: !!req.headers['x-appwrite-key']
        }
      });
    }

    if (!endpoint || !apiKey) {
      return res.json({
        success: false,
        error: 'Missing required parameters: endpoint and apiKey'
      });
    }

    // Validate endpoint to prevent abuse
    const validEndpoints = [
      'airportDatabase',
      'airlineDatabase', 
      'airplaneDatabase',
      'cityDatabase',
      'timetable'
    ];

    if (!validEndpoints.includes(endpoint)) {
      return res.json({
        success: false,
        error: 'Invalid endpoint. Allowed: ' + validEndpoints.join(', ')
      });
    }

    // Build the Aviation Edge API URL
    const baseUrl = 'https://aviation-edge.com/v2/public';
    
    // Handle timetable endpoint specially (it's just 'timetable', not 'timetableDatabase')
    const endpointPath = endpoint === 'timetable' ? 'timetable' : endpoint;
    const url = `${baseUrl}/${endpointPath}?key=${apiKey}`;
    
    // Add additional parameters if provided
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }

    const finalUrl = queryParams.toString() ? `${url}&${queryParams.toString()}` : url;

    console.log(`🔍 Proxying request to: ${finalUrl}`);

    // Make the request to Aviation Edge
    const response = await fetch(finalUrl);
    
    if (!response.ok) {
      throw new Error(`Aviation Edge API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ Successfully retrieved data from ${endpoint}`);
    
    return res.json({
      success: true,
      data: data,
      endpoint: endpoint,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in aviation enrichment proxy:', error);
    
    return res.json({
      success: false,
      error: 'Proxy error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
