import { Client } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // CORS headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.json({}, 200, headers);
  }

  try {
    // Parse request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, searchData } = body;

    log(`Flight search request: ${action}`);

    // Get Amadeus token
    const getAmadeusToken = async () => {
      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      const apiMode = process.env.AMADEUS_API_MODE || 'test'; // 'test' or 'production'
      
      if (!clientId || !clientSecret) {
        throw new Error('Amadeus credentials not configured');
      }

      const baseUrl = apiMode === 'production' 
        ? 'https://api.amadeus.com'
        : 'https://test.api.amadeus.com';
      
      const tokenBody = `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;
      
      const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenBody
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amadeus auth failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return { token: data.access_token, baseUrl };
    };

    // Search flights
    if (action === 'search') {
      const { token, baseUrl } = await getAmadeusToken();
      
      // Map travel class
      const travelClassMap = {
        'economy': 'ECONOMY',
        'premium-economy': 'PREMIUM_ECONOMY',
        'business': 'BUSINESS',
        'first': 'FIRST'
      };

      const params = new URLSearchParams({
        originLocationCode: searchData.from,
        destinationLocationCode: searchData.to,
        departureDate: searchData.departDate,
        adults: String(searchData.passengers.adults),
        travelClass: travelClassMap[searchData.cabinClass] || 'ECONOMY',
        currencyCode: searchData.currency || 'USD',
        max: String(searchData.max || 10),
      });

      if (searchData.tripType === 'roundtrip' && searchData.returnDate) {
        params.append('returnDate', searchData.returnDate);
      }

      if (searchData.passengers.children > 0) {
        params.append('children', String(searchData.passengers.children));
      }

      if (searchData.passengers.infants > 0) {
        params.append('infants', String(searchData.passengers.infants));
      }

      if (searchData.nonStop) {
        params.append('nonStop', 'true');
      }

      log(`Searching flights: ${params.toString()}`);

      const flightResponse = await fetch(`${baseUrl}/v2/shopping/flight-offers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!flightResponse.ok) {
        const errorData = await flightResponse.text();
        error(`Amadeus flight search failed: ${flightResponse.status} - ${errorData}`);
        throw new Error(`Flight search failed: ${flightResponse.status}`);
      }

      const flightData = await flightResponse.json();
      log(`Found ${flightData.data?.length || 0} flight offers`);

      return res.json({
        success: true,
        data: flightData.data || [],
        dictionaries: flightData.dictionaries || {},
        meta: flightData.meta || {}
      }, 200, headers);
    }

    // Price analysis
    if (action === 'price-analysis') {
      const { token, baseUrl } = await getAmadeusToken();
      
      const params = new URLSearchParams({
        originIataCode: searchData.from,
        destinationIataCode: searchData.to,
        departureDate: searchData.departDate,
        currencyCode: searchData.currency || 'USD',
      });

      if (searchData.tripType === 'roundtrip' && searchData.returnDate) {
        params.append('returnDate', searchData.returnDate);
      }

      log(`Fetching price analysis: ${params.toString()}`);

      const priceResponse = await fetch(`${baseUrl}/v1/analytics/itinerary-price-metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!priceResponse.ok) {
        // Price analysis is optional, don't fail if it doesn't work
        log(`Price analysis not available: ${priceResponse.status}`);
        return res.json({
          success: true,
          data: null
        }, 200, headers);
      }

      const priceData = await priceResponse.json();
      
      return res.json({
        success: true,
        data: priceData.data?.[0] || null
      }, 200, headers);
    }

    // Airport/Location Search
    if (action === 'airport-search') {
      const { token, baseUrl } = await getAmadeusToken();
      
      // Get query from either searchData.query or body.query
      const searchQuery = searchData?.query || body.query || '';
      
      const params = new URLSearchParams({
        keyword: searchQuery,
        subType: 'AIRPORT,CITY',
        'page[limit]': '10'
      });

      log(`Searching airports/cities: ${params.toString()}`);

      const locationResponse = await fetch(`${baseUrl}/v1/reference-data/locations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!locationResponse.ok) {
        const errorData = await locationResponse.text();
        log(`Amadeus location search failed: ${locationResponse.status} - ${errorData}`);
        // Return empty results instead of error (fallback to local data on frontend)
        return res.json({
          success: true,
          data: []
        }, 200, headers);
      }

      const locationData = await locationResponse.json();
      log(`Found ${locationData.data?.length || 0} locations`);

      return res.json({
        success: true,
        data: locationData.data || []
      }, 200, headers);
    }

    // Unknown action
    throw new Error(`Unknown action: ${action}`);

  } catch (err) {
    error(`Error: ${err.message}`);
    return res.json({
      success: false,
      error: err.message
    }, 500, headers);
  }
};
