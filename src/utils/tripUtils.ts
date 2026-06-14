import { Trip } from '../types/trip';

/**
 * Check if a trip has passed its end date
 * @param trip - The trip to check
 * @returns true if the trip end date has passed, false otherwise
 */
export const isTripOver = (trip: Trip): boolean => {
  const now = new Date();
  const endDate = new Date(trip.endDate);
  
  // Set time to end of day for the end date to ensure trips are marked as over after the full day
  endDate.setHours(23, 59, 59, 999);
  
  return now > endDate;
};

/**
 * Get the appropriate status for a trip based on its dates
 * @param trip - The trip to check
 * @returns the appropriate status for the trip
 */
export const getTripStatus = (trip: Trip): Trip['status'] => {
  // If trip is already cancelled, keep it cancelled
  if (trip.status === 'cancelled') {
    return 'cancelled';
  }
  
  // If trip is already completed, keep it completed
  if (trip.status === 'completed') {
    return 'completed';
  }
  
  // Check if trip has passed
  if (isTripOver(trip)) {
    return 'over';
  }
  
  // Return the current status or default to planning
  return trip.status || 'planning';
};

/**
 * Check if a trip is currently active (between start and end dates)
 * @param trip - The trip to check
 * @returns true if the trip is currently active, false otherwise
 */
export const isTripActive = (trip: Trip): boolean => {
  const now = new Date();
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  // Set start date to beginning of day and end date to end of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return now >= startDate && now <= endDate;
};

/**
 * Check if a trip is upcoming (start date is in the future)
 * @param trip - The trip to check
 * @returns true if the trip is upcoming, false otherwise
 */
export const isTripUpcoming = (trip: Trip): boolean => {
  const now = new Date();
  const startDate = new Date(trip.startDate);
  
  // Set start date to beginning of day
  startDate.setHours(0, 0, 0, 0);
  
  return now < startDate;
};
