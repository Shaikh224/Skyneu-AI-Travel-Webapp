import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TripDetailPage from './TripDetailPage';

const TripDetailPageWrapper: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  if (!tripId) {
    navigate('/trip-planner');
    return null;
  }

  return (
    <TripDetailPage 
      tripId={tripId} 
      onBack={() => navigate('/trip-planner')} 
    />
  );
};

export default TripDetailPageWrapper;
