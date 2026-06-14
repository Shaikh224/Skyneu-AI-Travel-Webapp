import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, AlertCircle, CheckCircle, Users, Calendar, MapPin } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import AppwriteAuthModal from '@/components/auth/AppwriteAuthModal';
import { tripService } from '@/services/tripService';
import { Trip, TripMember } from '@/types/trip';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const GuestTripPage: React.FC = () => {
  const { joinCode } = useParams<{ joinCode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [joining, setJoining] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const initializeAccess = async () => {
      console.log('Initializing access:', { joinCode, isAuthenticated, authLoading });
      if (!joinCode) {
        toast.error('Invalid trip link.');
        navigate('/');
        return;
      }

      // Wait for authentication status to be determined
      if (authLoading) {
        console.log('Auth still loading, waiting...');
        return;
      }

      // Check authentication status
      if (!isAuthenticated) {
        console.log('User not authenticated, showing auth modal');
        // Show auth modal instead of redirecting
        setShowAuthModal(true);
        setLoading(false);
        return;
      }

      // User is authenticated, check if already a member
      try {
        // First, try to get trip details
        const tripData = await tripService.getTripByJoinCode(joinCode);
        if (!tripData) {
          toast.error('Trip not found or join code invalid.');
          navigate('/');
          return;
        }

        // Check if user is already a member of this trip
        const members = await tripService.getTripMembers(tripData.$id!);
        const existingMember = members.find(member => member.userId === user.$id);
        
        if (existingMember) {
          console.log('User already a member, redirecting to trip:', tripData.title);
          toast.success(`Welcome back to ${tripData.title}!`);
          navigate(`/trip/${tripData.$id}`);
          return;
        }

        // User is not a member, show confirmation to join
        setTrip(tripData);
        setShowConfirmation(true);
      } catch (error) {
        console.error('Error fetching trip:', error);
        toast.error('Failed to load trip details.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    initializeAccess();
  }, [joinCode, isAuthenticated, authLoading, navigate, user]);

  // Handle authentication success
  useEffect(() => {
    console.log('Auth success effect:', { isAuthenticated, showAuthModal, joinCode });
    if (isAuthenticated && showAuthModal) {
      console.log('User authenticated, closing modal and loading trip');
      setShowAuthModal(false);
      // Re-run the initialization now that user is authenticated
      const initializeAccess = async () => {
        if (!joinCode) return;
        
        try {
          console.log('Fetching trip data for joinCode:', joinCode);
          const tripData = await tripService.getTripByJoinCode(joinCode);
          if (!tripData) {
            console.log('Trip not found');
            toast.error('Trip not found or join code invalid.');
            navigate('/');
            return;
          }

          // Check if user is already a member of this trip
          const members = await tripService.getTripMembers(tripData.$id!);
          const existingMember = members.find(member => member.userId === user.$id);
          
          if (existingMember) {
            console.log('User already a member, redirecting to trip:', tripData.title);
            toast.success(`Welcome back to ${tripData.title}!`);
            navigate(`/trip/${tripData.$id}`);
            return;
          }

          // User is not a member, show confirmation to join
          console.log('Trip data loaded:', tripData.title);
          setTrip(tripData);
          setShowConfirmation(true);
        } catch (error) {
          console.error('Error fetching trip:', error);
          toast.error('Failed to load trip details.');
          navigate('/');
        }
      };
      
      initializeAccess();
    }
  }, [isAuthenticated, showAuthModal, joinCode, navigate, user]);

  // Handle modal close without authentication (fallback)
  useEffect(() => {
    if (!showAuthModal && !isAuthenticated && !authLoading) {
      // If modal was closed and user is still not authenticated, redirect to home
      const timer = setTimeout(() => {
        navigate('/');
      }, 1000); // Small delay to allow for auth state to update
      
      return () => clearTimeout(timer);
    }
  }, [showAuthModal, isAuthenticated, authLoading, navigate]);

  const handleJoinTrip = async () => {
    if (!user || !joinCode) return;

    console.log('Joining trip:', { joinCode, userId: user.$id, userName: user.name });
    setJoining(true);
    try {
      const { trip: tripData, member } = await tripService.joinTripAsGuest(joinCode, user.$id, user.name);
      console.log('Successfully joined trip:', { tripId: tripData.$id, tripTitle: tripData.title });
      toast.success(`Welcome to ${tripData.title}! You now have viewer access.`);
      console.log('Navigating to trip page:', `/trip/${tripData.$id}`);
      navigate(`/trip/${tripData.$id}`);
    } catch (error: any) {
      console.error('Error joining trip:', error);
      toast.error(error.message || 'Failed to join trip.');
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
        <Header />
        <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-skyneu-blue" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (showConfirmation && trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
        <Header />
        <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {/* Back Button */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-medium">Back to Home</span>
                </button>
              </div>

              {/* Confirmation Card */}
              <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Join Trip as Viewer
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    You're about to join this trip with limited viewer access. No subscription required!
                  </p>
                </div>

                {/* Trip Details */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {trip.title}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-skyneu-blue" />
                      <span className="text-gray-700 dark:text-gray-300">{trip.destination}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-skyneu-blue" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {trip.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-4">
                      {trip.description}
                    </p>
                  )}
                </div>

                {/* Viewer Access Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    What you can do as a viewer:
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      View trip details and itinerary
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Vote on activities and suggestions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Add your personal expenses
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      See trip members and their contributions
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinTrip}
                    disabled={joining}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join as Viewer'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {/* Auth Modal */}
      <AppwriteAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // Don't navigate to home immediately - let auth success handler take care of it
        }}
        type="login"
      />
    </>
  );
};

export default GuestTripPage;