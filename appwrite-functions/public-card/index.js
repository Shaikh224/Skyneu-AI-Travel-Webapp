// Use server-side SDK
const { Client, Databases, Query } = require('node-appwrite');

module.exports = async (context) => {
  const { req, res, log, error } = context;

  try {
    // Parse request data
    const { slug } = JSON.parse(req.bodyRaw || '{}');
    
    if (!slug) {
      return res.json({ error: 'Missing slug parameter' }, 400);
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID;

    // Look up share card by slug
    const shareCardsResponse = await databases.listDocuments(
      databaseId,
      'share_cards',
      [Query.equal('slug', slug)]
    );

    if (shareCardsResponse.documents.length === 0) {
      return res.json({ error: 'Share link not found' }, 404);
    }

    const shareCard = shareCardsResponse.documents[0];

    // Validate share card status and expiration
    const now = new Date();
    const expiresAt = new Date(shareCard.expires_at);

    if (shareCard.status !== 'active') {
      return res.json({ error: 'Share link has been disabled' }, 410);
    }

    if (expiresAt < now) {
      return res.json({ error: 'Share link has expired' }, 410);
    }

    // Fetch linked flight data
    const flightResponse = await databases.getDocument(
      databaseId,
      'saved_flights',
      shareCard.flight_ref
    );

    if (!flightResponse) {
      return res.json({ error: 'Flight data not found' }, 404);
    }

    const flight = flightResponse;

    // Parse JSON fields
    const parseJsonField = (field) => {
      try {
        return typeof field === 'string' ? JSON.parse(field) : field;
      } catch {
        return field;
      }
    };

    const flightData = parseJsonField(flight.flight);
    const airlineData = parseJsonField(flight.airline);
    const departureData = parseJsonField(flight.departure);
    const arrivalData = parseJsonField(flight.arrival);

    // Build sanitized response
    const publicFlightData = {
      flightNumber: flight.flightNumber,
      route: {
        departure: {
          airport: departureData?.airport || 'Unknown',
          city: departureData?.airportCity,
          country: departureData?.airportCountry,
          gate: departureData?.gate,
          terminal: departureData?.terminal,
          scheduledTime: departureData?.scheduledTime,
          actualTime: departureData?.actualTime,
          estimatedTime: departureData?.estimatedTime,
        },
        arrival: {
          airport: arrivalData?.airport || 'Unknown',
          city: arrivalData?.airportCity,
          country: arrivalData?.airportCountry,
          gate: arrivalData?.gate,
          terminal: arrivalData?.terminal,
          scheduledTime: arrivalData?.scheduledTime,
          actualTime: arrivalData?.actualTime,
          estimatedTime: arrivalData?.estimatedTime,
        }
      },
      status: flight.status || 'Unknown',
      aircraft: {
        model: flightData?.aircraft?.model || airlineData?.aircraft,
        registration: flightData?.aircraft?.registration,
        airline: airlineData?.name || flight.airline,
      },
      lastUpdated: flight.savedAt || new Date().toISOString()
    };

    // Add optional passenger data if allowed
    if (shareCard.allow_name && flight.passengerInitials) {
      publicFlightData.passengerInitials = flight.passengerInitials;
    }

    if (shareCard.allow_seat && flight.seat) {
      publicFlightData.seat = flight.seat;
    }

    // Add custom message if provided
    if (shareCard.custom_message) {
      publicFlightData.customMessage = shareCard.custom_message;
    }

    log('Successfully fetched public flight data for slug:', slug);
    return res.json(publicFlightData, 200);

  } catch (err) {
    error('Error in public-card function:', err);
    return res.json({ error: 'Internal server error' }, 500);
  }
};
