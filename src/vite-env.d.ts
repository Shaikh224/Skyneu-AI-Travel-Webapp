/// <reference types="vite/client" />
/// <reference types="node" />

interface ImportMetaEnv {
  readonly VITE_SONAR_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_UNSPLASH_ACCESS_KEY: string;
  readonly VITE_NEWS_API_KEY: string;
  readonly VITE_FR24_API_KEY: string;
  readonly VITE_AVIATIONSTACK_API_KEY: string;
  readonly VITE_AVIATION_EDGE_API_KEY: string;
  readonly VITE_SANITY_PROJECT_ID: string;
  readonly VITE_SANITY_DATASET: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_DATABASE_ID: string;
  readonly VITE_APPWRITE_FUNCTION_ID: string;
  readonly VITE_APPWRITE_FUNCTION_PERPLEXITY_SEARCH: string;
  readonly VITE_APPWRITE_DODO_FUNCTION_ID: string;
  readonly VITE_APPWRITE_USER_PREFERENCES_COLLECTION_ID: string;
  readonly VITE_APPWRITE_TRIPS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_TRIP_MEMBERS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_ACTIVITIES_COLLECTION_ID: string;
  readonly VITE_APPWRITE_CHECKLIST_COLLECTION_ID: string;
  readonly VITE_APPWRITE_EXPENSES_COLLECTION_ID: string;
  readonly VITE_APPWRITE_SAVED_FLIGHTS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_SHARE_CARDS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_NOTIFICATION_PREFERENCES_COLLECTION_ID: string;
  readonly VITE_FLIGHT_SEARCH_FUNCTION_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
