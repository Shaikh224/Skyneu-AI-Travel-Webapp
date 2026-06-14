import React from 'react';
import TripPlanner from '@/components/trips/TripPlanner';
import SEOHead from '@/components/seo/SEOHead';

const TripPlannerPage: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Trip Planner - Build Smart Itineraries with AI | SkyNeu"
        description="Plan your trips with AI. Create day-by-day itineraries, budget estimates, and personalized recommendations in minutes."
        canonical="https://skyneu.com/trip-planner"
        keywords="trip planner, itinerary planner, travel planning, ai trip planner, skyneu"
      />
      <TripPlanner />
    </>
  );
};

export default TripPlannerPage;