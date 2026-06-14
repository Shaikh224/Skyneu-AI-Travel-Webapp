import { Client, Databases, Query, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // Initialize Appwrite client
  const client = new Client();
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // Set CORS headers
  res.headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.send('OK', 200);
  }

  try {
    const body = JSON.parse(req.body || '{}');
    const { action, joinCode, guestName, tripId, guestId, activityId, votes, expenseData } = body;

    log(`Guest access request: ${action}`);

    switch (action) {
      case 'join':
        return await handleJoinTrip(databases, joinCode, guestName, log, error, res);
      
      case 'getTripData':
        return await handleGetTripData(databases, tripId, log, error, res);
      
      case 'voteOnActivity':
        return await handleVoteOnActivity(databases, activityId, votes, guestId, log, error, res);
      
      case 'addExpense':
        return await handleAddExpense(databases, expenseData, log, error, res);
      
      case 'getGuestMember':
        return await handleGetGuestMember(databases, tripId, guestId, log, error, res);
      
      default:
        return res.json({ error: 'Invalid action' }, 400);
    }
  } catch (err) {
    error(`Guest access error: ${err.message}`);
    return res.json({ error: 'Internal server error', details: err.message }, 500);
  }
};

// Handle guest joining a trip
async function handleJoinTrip(databases, joinCode, guestName, log, error, res) {
  try {
    log(`Guest attempting to join trip with code: ${joinCode}`);
    
    // Find trip by join code
    const tripResponse = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.TRIPS_COLLECTION_ID,
      [
        Query.equal('joinCode', joinCode),
        Query.equal('joinCodeEnabled', true)
      ]
    );

    if (tripResponse.documents.length === 0) {
      log(`Trip not found for join code: ${joinCode}`);
      return res.json({ error: 'Invalid join code or code has been disabled' }, 400);
    }

    const trip = tripResponse.documents[0];
    const generatedGuestId = 'guest_' + ID.unique();
    
    log(`Found trip: ${trip.title} (${trip.$id})`);

    // Check if guest is already a member (by name and trip)
    const existingGuest = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.TRIP_MEMBERS_COLLECTION_ID,
      [
        Query.equal('tripId', trip.$id),
        Query.equal('name', guestName),
        Query.isNull('userId') // Ensure it's a guest record
      ]
    );

    let member;
    let finalGuestId = generatedGuestId;

    if (existingGuest.documents.length > 0) {
      // Guest already exists, use existing record
      member = existingGuest.documents[0];
      finalGuestId = member.guestId;
      log(`Existing guest found: ${guestName} with ID: ${finalGuestId}`);
    } else {
      // Create new guest member
      member = await databases.createDocument(
        process.env.DATABASE_ID,
        process.env.TRIP_MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          tripId: trip.$id,
          guestId: generatedGuestId,
          role: 'viewer',
          name: guestName,
          status: 'active',
          joinedAt: new Date().toISOString()
        }
      );
      log(`Created new guest member: ${guestName} with ID: ${generatedGuestId}`);
    }

    const guestInfo = {
      guestId: finalGuestId,
      name: guestName,
      tripId: trip.$id
    };

    log(`Guest successfully joined trip: ${trip.title}`);
    return res.json({ 
      success: true,
      trip, 
      member, 
      guestInfo 
    });

  } catch (err) {
    error(`Error joining trip: ${err.message}`);
    return res.json({ error: 'Failed to join trip', details: err.message }, 500);
  }
}

// Handle getting trip data for guests
async function handleGetTripData(databases, tripId, log, error, res) {
  try {
    log(`Getting trip data for: ${tripId}`);

    // Get all trip data in parallel
    const [tripData, membersData, activitiesData, checklistData, expensesData] = await Promise.all([
      databases.getDocument(process.env.DATABASE_ID, process.env.TRIPS_COLLECTION_ID, tripId),
      databases.listDocuments(process.env.DATABASE_ID, process.env.TRIP_MEMBERS_COLLECTION_ID, [
        Query.equal('tripId', tripId)
      ]),
      databases.listDocuments(process.env.DATABASE_ID, process.env.ACTIVITIES_COLLECTION_ID, [
        Query.equal('tripId', tripId),
        Query.orderAsc('date')
      ]),
      databases.listDocuments(process.env.DATABASE_ID, process.env.CHECKLIST_COLLECTION_ID, [
        Query.equal('tripId', tripId)
      ]),
      databases.listDocuments(process.env.DATABASE_ID, process.env.EXPENSES_COLLECTION_ID, [
        Query.equal('tripId', tripId),
        Query.orderDesc('createdAt')
      ])
    ]);

    log(`Retrieved trip data: ${tripData.title}`);

    return res.json({
      success: true,
      trip: tripData,
      members: membersData.documents,
      activities: activitiesData.documents,
      checklist: checklistData.documents,
      expenses: expensesData.documents
    });

  } catch (err) {
    error(`Error getting trip data: ${err.message}`);
    return res.json({ error: 'Failed to get trip data', details: err.message }, 500);
  }
}

// Handle guest voting on activities
async function handleVoteOnActivity(databases, activityId, votes, guestId, log, error, res) {
  try {
    log(`Guest ${guestId} voting on activity: ${activityId}`);

    // Get current activity
    const activity = await databases.getDocument(
      process.env.DATABASE_ID,
      process.env.ACTIVITIES_COLLECTION_ID,
      activityId
    );

    // Update activity with new votes
    const updatedActivity = await databases.updateDocument(
      process.env.DATABASE_ID,
      process.env.ACTIVITIES_COLLECTION_ID,
      activityId,
      {
        votes: JSON.stringify(votes),
        updatedAt: new Date().toISOString()
      }
    );

    log(`Vote recorded for activity: ${activityId}`);
    return res.json({
      success: true,
      activity: updatedActivity
    });

  } catch (err) {
    error(`Error voting on activity: ${err.message}`);
    return res.json({ error: 'Failed to record vote', details: err.message }, 500);
  }
}

// Handle guest adding expenses
async function handleAddExpense(databases, expenseData, log, error, res) {
  try {
    log(`Guest adding expense: ${expenseData.description}`);

    const now = new Date().toISOString();
    const newExpense = await databases.createDocument(
      process.env.DATABASE_ID,
      process.env.EXPENSES_COLLECTION_ID,
      ID.unique(),
      {
        ...expenseData,
        createdAt: now,
        updatedAt: now
      }
    );

    log(`Expense created: ${newExpense.$id}`);
    return res.json({
      success: true,
      expense: newExpense
    });

  } catch (err) {
    error(`Error adding expense: ${err.message}`);
    return res.json({ error: 'Failed to add expense', details: err.message }, 500);
  }
}

// Handle getting guest member info
async function handleGetGuestMember(databases, tripId, guestId, log, error, res) {
  try {
    log(`Getting guest member: ${guestId} for trip: ${tripId}`);

    const response = await databases.listDocuments(
      process.env.DATABASE_ID,
      process.env.TRIP_MEMBERS_COLLECTION_ID,
      [
        Query.equal('tripId', tripId),
        Query.equal('guestId', guestId)
      ]
    );

    if (response.documents.length > 0) {
      return res.json({
        success: true,
        member: response.documents[0]
      });
    } else {
      return res.json({
        success: true,
        member: null
      });
    }

  } catch (err) {
    error(`Error getting guest member: ${err.message}`);
    return res.json({ error: 'Failed to get guest member', details: err.message }, 500);
  }
}
