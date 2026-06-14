import React, { useState } from 'react';
import { Sparkles, Brain } from 'lucide-react';
import TripListPage from '@/pages/others/TripListPage';
import TripDetailPage from '@/pages/others/TripDetailPage';
import Header from '@/components/layout/Header';
import TripCreationForm from '@/components/trips/TripCreationForm';

type ViewMode = 'list' | 'detail' | 'create';

const TripPlanner: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedTripId(null);
    setViewMode('list');
  };

  const handleCreateTrip = () => {
    setViewMode('create');
  };

  const handleTripCreated = () => {
    setViewMode('list');
  };

  // Render based on view mode
  if (viewMode === 'list') {
    return (
      <TripListPage 
        onSelectTrip={handleSelectTrip}
        onCreateTrip={handleCreateTrip}
      />
    );
  }

  if (viewMode === 'detail' && selectedTripId) {
    return (
      <TripDetailPage 
        tripId={selectedTripId}
        onBack={handleBackToList}
      />
    );
  }

  if (viewMode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
        <Header />
        
        <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
          <div className="container mx-auto px-4">
            {/* Page Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-skyneu-blue/20">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI-POWERED TRIP PLANNING</span>
                <span className="sm:hidden">AI TRIP PLANNER</span>
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <h1 className="font-bold text-2xl sm:text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4 bg-gradient-to-r from-skyneu-dark dark:from-dark-text to-skyneu-blue bg-clip-text text-transparent">
                Create New Trip
              </h1>
              <p className="text-skyneu-text dark:text-dark-text-secondary max-w-2xl mx-auto text-sm sm:text-lg px-4">
                Plan your perfect journey with our intelligent trip planning assistant.
              </p>
            </div>

            {/* Trip Creation Component */}
            <TripCreationForm 
              createMode={true}
              onTripCreated={handleTripCreated} 
              onCancel={handleBackToList} 
            />
          </div>
        </main>
      </div>
    );
  }

  // Fallback
  return (
    <TripListPage 
      onSelectTrip={handleSelectTrip}
      onCreateTrip={handleCreateTrip}
    />
  );
};

export default TripPlanner;
