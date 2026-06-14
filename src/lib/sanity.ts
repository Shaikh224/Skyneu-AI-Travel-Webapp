import { createClient } from '@sanity/client'

// Client for browser usage (React) - Public read-only access
export const client = createClient({
  projectId: 'qw48169l',
  dataset: 'production',
  apiVersion: '2023-12-01',
  useCdn: true, // Use CDN for faster, cached responses
})

// For server-side rendering or draft content (if needed in future)
// Note: In a real app, this should only be used server-side, not in browser
export const serverClient = createClient({
  projectId: 'qw48169l',
  dataset: 'production',
  apiVersion: '2023-12-01',
  useCdn: false, // Always fresh data
  // Token removed for browser safety - only use server-side.
})

// Default export for backward compatibility
export default client
