const { Client, Databases } = require('node-appwrite');

// This is your Appwrite function
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

  try {
    // Log the raw request for debugging
    log('Raw request body:', JSON.stringify(req.body));
    log('Request method:', req.method);
    log('Request headers:', JSON.stringify(req.headers));
    log('Request variables:', JSON.stringify(req.variables));

    // Parse request body - Appwrite functions might receive data in different ways
    let body;
    try {
      // Try different ways Appwrite might send the data
      if (req.body) {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } else if (req.variables && Object.keys(req.variables).length > 0) {
        // Sometimes data comes through variables
        body = req.variables;
      } else if (req.query && Object.keys(req.query).length > 0) {
        // Sometimes data comes through query parameters
        body = req.query;
      } else {
        error('No request data found in body, variables, or query');
        return res.json({ 
          success: false, 
          error: 'No request data found',
          debug: {
            hasBody: !!req.body,
            hasVariables: !!(req.variables && Object.keys(req.variables).length > 0),
            hasQuery: !!(req.query && Object.keys(req.query).length > 0)
          }
        }, 400, headers);
      }
      
      log('Parsed body:', JSON.stringify(body));
    } catch (e) {
      error('Failed to parse request data:', e);
      return res.json({ 
        success: false, 
        error: 'Invalid request data format',
        details: e.message
      }, 400, headers);
    }

    const { query, max_results = 5, max_tokens_per_page = 1024, recency_days = 10, include_social = true } = body;
    
    // Try to get up to 5 results (Perplexity may still limit to 3)
    const safeMaxResults = Math.min(Math.max(parseInt(max_results) || 5, 1), 5);

    // Validate query parameter
    if (!query) {
      return res.json({ 
        success: false, 
        error: 'Query parameter is required' 
      }, 400, headers);
    }

    // Get API key from environment variables (same key works for both Sonar and Search API)
    const apiKey = process.env.SONAR_PRO_API_KEY || process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      error('Perplexity API key not configured');
      return res.json({ 
        success: false, 
        error: 'Perplexity API key not configured. Please set SONAR_PRO_API_KEY environment variable.' 
      }, 500, headers);
    }

    log(`Searching Perplexity for: ${query} (max_results: ${safeMaxResults})`);

    // Parse the query to extract flight components
    let airline = '';
    let flightNumber = '';
    let departure = '';
    let arrival = '';
    
    // Try to extract components from the query
    const queryParts = query.split(' ');
    queryParts.forEach(part => {
      // Check if it's a flight number (e.g., AI2381)
      if (/^[A-Z]{2}\d+/.test(part)) {
        flightNumber = part;
        airline = part.substring(0, 2); // Get airline code
      }
      // Check if it's an airport code (3 letters)
      else if (/^[A-Z]{3}$/.test(part)) {
        if (!departure) departure = part;
        else if (!arrival) arrival = part;
      }
    });
    
    // Build comprehensive query targeting news sources directly
    let enhancedQuery = query;
    
    // Add site-specific searches for major news sources
    const newsSites = [
      'site:news.google.com',
      'site:bing.com/news',
      'site:reuters.com',
      'site:bloomberg.com',
      'site:cnn.com',
      'site:bbc.com',
      'site:hindustantimes.com',
      'site:timesofindia.com',
      'site:ndtv.com',
      'site:indianexpress.com'
    ];
    
    // Add news site targeting if we have room
    if (enhancedQuery.length <= 200) {
      // Add a few key news sites
      enhancedQuery += ` (site:news.google.com OR site:bing.com/news OR site:reuters.com OR site:bloomberg.com)`;
    }
    
    // Add "news today" to encourage actual news articles
    if (!enhancedQuery.includes('news')) {
      enhancedQuery += ' news';
    }
    if (!enhancedQuery.includes('today')) {
      enhancedQuery += ' today';
    }
    
    // Add exclusions for tracker sites (using negative keywords)
    const exclusions = '-flightaware -flightradar -flightstats -flightview -tracker -booking -expedia';
    if (enhancedQuery.length + exclusions.length <= 240) {
      enhancedQuery += ` ${exclusions}`;
    }
    
    // Add comprehensive keywords for different news types
    const keywords = [
      'latest',
      'breaking',
      'delay',
      'weather',
      'strike'
    ];
    
    // Add keywords that fit within limit
    for (const keyword of keywords) {
      if (enhancedQuery.length + keyword.length + 1 <= 240) {
        if (!enhancedQuery.includes(keyword)) {
          enhancedQuery += ` ${keyword}`;
        }
      }
    }
    
    // Ensure query is under 256 characters
    if (enhancedQuery.length > 250) {
      enhancedQuery = enhancedQuery.substring(0, 250);
    }
    
    log(`Final query length: ${enhancedQuery.length} characters`);
    log(`Final query: ${enhancedQuery}`);

    // Make request to Perplexity Search API for web-based news discovery
    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: enhancedQuery,
        max_results: safeMaxResults,
        max_tokens_per_page: Math.min(Math.max(parseInt(max_tokens_per_page) || 1024, 100), 2048),
        country: "IN", // Focus on Indian news sources
        web_search_options: {
          search_context_size: "medium"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      error(`Perplexity API error: ${response.status} - ${errorText}`);
      return res.json({ 
        success: false,
        error: `Perplexity API error: ${response.status}`,
        details: errorText 
      }, response.status, headers);
    }

    // Process Perplexity web search results
    const data = await response.json();
    const perplexityResults = data.results || [];
    
    log(`Found ${perplexityResults.length} web search results from news sources`);
    
    // Filter and validate results from web search
    const filteredResults = perplexityResults.filter(result => {
      // Basic validation - ensure we have title and url
      const hasTitle = result.title && result.title.trim().length > 0;
      const hasUrl = result.url && result.url.trim().length > 0;
      
      if (!hasTitle || !hasUrl) {
        log(`Filtering out result without title or URL:`, result);
        return false;
      }
      
      // Log the date for debugging but don't filter
      try {
        const dateStr = result.date || result.publishedAt || result.last_updated || result.timestamp;
        if (dateStr) {
          const resultDate = new Date(dateStr);
          log(`Result date: ${dateStr} (parsed: ${resultDate.toISOString()})`);
        } else {
          log(`No date found for result`);
        }
      } catch (e) {
        log(`Date parsing failed: ${e.message}`);
      }
      
      return true; // Include all results with valid title and URL
    });

    log(`Filtered to ${filteredResults.length} valid results from web search`);

    // Return the filtered search results
    return res.json({
      success: true,
      results: filteredResults,
      id: `web-search-${Date.now()}`,
      sources_used: {
        web_search: filteredResults.length,
        news_sites_targeted: ['google.com/news', 'bing.com/news', 'reuters.com', 'bloomberg.com', 'cnn.com', 'bbc.com', 'hindustantimes.com', 'timesofindia.com', 'ndtv.com', 'indianexpress.com']
      },
      total_results: filteredResults.length
    }, 200, headers);

  } catch (err) {
    error(`Error in perplexity search function: ${err.message}`);
    return res.json({ 
      success: false,
      error: 'Internal server error',
      details: err.message 
    }, 500, headers);
  }
};
