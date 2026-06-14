import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Users, Plane, Clock, ArrowRight, Star, Settings, Edit, Trash2, MoreVertical, Camera, CheckCircle, Share2, Copy, FileText } from 'lucide-react';
import Header from '@/components/layout/Header';
import UnsplashImagePicker from '../../components/UnsplashImagePicker';
import TripTemplatePicker from '../../components/trips/TripTemplatePicker';
import { TripTemplate } from '../../data/tripTemplates';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { tripService } from '@/services/tripService';
import { Trip } from '@/types/trip';
import { getTripStatus, isTripActive, isTripUpcoming } from '@/utils/tripUtils';
import toast from 'react-hot-toast';

interface TripWithMembers extends Trip {
  memberCount: number;
  isOwner: boolean;
  userRole?: string;
}

interface TripListPageProps {
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: () => void;
}

const TripListPage: React.FC<TripListPageProps> = ({ onSelectTrip, onCreateTrip }) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'owned' | 'joined'>('all');
  const [showImagePicker, setShowImagePicker] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningTrip, setJoiningTrip] = useState(false);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user, filter]);

  const loadTrips = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userTrips = await tripService.getUserTrips(user.$id);
      
      const tripsWithDetails = await Promise.all(
        userTrips.map(async (trip) => {
          const members = await tripService.getTripMembers(trip.$id!);
          const userMember = members.find(m => m.userId === user.$id);
          
          // Get the appropriate status for the trip (automatically set to 'over' if past)
          const currentStatus = getTripStatus(trip);
          
          // If the status has changed and user is the owner, update it in the database
          if (currentStatus !== trip.status && trip.ownerId === user.$id) {
            try {
              await tripService.updateTrip(trip.$id!, { status: currentStatus });
              trip.status = currentStatus;
            } catch (error) {
              console.error('Error updating trip status:', error);
              // Continue with the current status if update fails
            }
          }
          
          return {
            ...trip,
            status: currentStatus,
            memberCount: members.length,
            isOwner: trip.ownerId === user.$id,
            userRole: userMember?.role
          };
        })
      );

      // Apply filter
      let filteredTrips = tripsWithDetails;
      if (filter === 'owned') {
        filteredTrips = tripsWithDetails.filter(trip => trip.isOwner);
      } else if (filter === 'joined') {
        filteredTrips = tripsWithDetails.filter(trip => !trip.isOwner);
      }

      setTrips(filteredTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await tripService.deleteTrip(tripId);
      toast.success('Trip deleted successfully');
      loadTrips();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    }
  };

  const handleUpdateTripImage = async (tripId: string, imageUrl: string) => {
    try {
      await tripService.updateTrip(tripId, { image: imageUrl });
      toast.success('Trip image updated!');
      loadTrips();
      setShowImagePicker(null);
    } catch (error) {
      console.error('Error updating trip image:', error);
      toast.error('Failed to update image');
    }
  };

  const handleStatusChange = async (tripId: string, newStatus: Trip['status']) => {
    try {
      await tripService.updateTrip(tripId, { status: newStatus });
      toast.success('Trip status updated!');
      loadTrips();
      setEditingStatus(null);
    } catch (error) {
      console.error('Error updating trip status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleTemplateSelect = async (template: TripTemplate) => {
    if (!user) return;

    try {
      setLoading(true);
      const tripData: Partial<Trip> = {
        title: template.name,
        destination: template.destination,
        startDate: '', // User needs to set dates
        endDate: '',
        budget: template.budget,
        description: template.description,
        memberCount: 1,
        ownerId: user.$id,
        status: 'planning'
      };

      await tripService.createTripWithOwner(tripData as Trip, {
        userId: user.$id,
        email: user.email,
        name: user.name || 'Anonymous User'
      });

      // Create activities from template
      if (template.activities.length > 0) {
        const trip = await tripService.getUserTrips(user.$id);
        const newTrip = trip.find(t => t.title === template.name);
        if (newTrip) {
          for (const activity of template.activities) {
            await tripService.createActivity({
              tripId: newTrip.$id!,
              title: activity,
              description: `Activity from ${template.name} template`,
              date: new Date().toISOString(),
              status: 'pending',
              category: 'activity'
            });
          }
        }
      }

      // Create checklist from template
      if (template.checklist.length > 0) {
        const trip = await tripService.getUserTrips(user.$id);
        const newTrip = trip.find(t => t.title === template.name);
        if (newTrip) {
          for (const item of template.checklist) {
            await tripService.createChecklistItem({
              tripId: newTrip.$id!,
              title: item,
              description: `Checklist item from ${template.name} template`,
              priority: 'medium',
              completed: false
            });
          }
        }
      }

      toast.success(`Trip "${template.name}" created from template!`);
      loadTrips();
      setShowTemplatePicker(false);
    } catch (error) {
      console.error('Error creating trip from template:', error);
      toast.error('Failed to create trip from template');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTrip = async () => {
    if (!user || !joinCode.trim()) {
      toast.error('Please enter a valid join code');
      return;
    }

    try {
      setJoiningTrip(true);
      const { trip } = await tripService.joinTripWithCode(joinCode.trim().toUpperCase(), {
        userId: user.$id,
        email: user.email,
        name: user.name || user.email
      });
      
      toast.success(`Successfully joined "${trip.title}"!`);
      setShowJoinModal(false);
      setJoinCode('');
      loadTrips(); // Refresh the trips list
    } catch (error: any) {
      console.error('Error joining trip:', error);
      toast.error(error.message || 'Failed to join trip');
    } finally {
      setJoiningTrip(false);
    }
  };

  const handleShareTrip = async (tripId: string) => {
    try {
      const trip = await tripService.getTrip(tripId);
      
      // Enable join code if not already enabled
      if (!trip.joinCodeEnabled) {
        await tripService.toggleJoinCode(tripId, true);
        toast.success('Join code activated!');
      }
      
      setShareCode(trip.joinCode || '');
      setShowShareModal(tripId);
    } catch (error) {
      console.error('Error getting share code:', error);
      toast.error('Failed to get share code');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Join code copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Join code copied to clipboard!');
    }
  };

  const regenerateJoinCode = async (tripId: string) => {
    try {
      const newCode = await tripService.regenerateJoinCode(tripId);
      setShareCode(newCode);
      toast.success('New join code generated!');
    } catch (error) {
      console.error('Error regenerating join code:', error);
      toast.error('Failed to regenerate join code');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'active': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'over': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Star className="h-3 w-3 text-yellow-500" />;
      case 'admin': return <Settings className="h-3 w-3 text-purple-500" />;
      case 'co-admin': return <Settings className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDaysRemaining = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
        <Header />
        <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skyneu-blue"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      <Header />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="font-bold text-2xl sm:text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-2">
                My Trips
              </h1>
              <p className="text-skyneu-text dark:text-dark-text-secondary">
                Manage your travel plans and adventures
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <button
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                <Plus className="h-4 w-4" />
                Join Trip
              </button>
              <button
                onClick={() => setShowTemplatePicker(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                <FileText className="h-4 w-4" />
                Use Template
              </button>
              <button
                onClick={onCreateTrip}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                <Plus className="h-4 w-4" />
                Create New Trip
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-dark-surface rounded-lg p-1">
            {[
              { key: 'all', label: 'All Trips' },
              { key: 'owned', label: 'My Trips' },
              { key: 'joined', label: 'Joined Trips' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? 'bg-white dark:bg-dark-bg text-skyneu-blue shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-skyneu-blue dark:hover:text-skyneu-blue'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Trips Grid */}
          {trips.length === 0 ? (
            <div className="text-center py-12">
              <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No trips found
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                {filter === 'all' ? 'Start planning your next adventure!' : 
                 filter === 'owned' ? 'Create your first trip to get started' :
                 'You haven\'t joined any trips yet'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {filter === 'joined' ? (
                  <>
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Join a Trip
                    </button>
                    <button
                      onClick={onCreateTrip}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Create Your First Trip
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onCreateTrip}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Trip
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
                const daysRemaining = calculateDaysRemaining(trip.startDate);
                const isUpcoming = isTripUpcoming(trip);
                const isActive = isTripActive(trip);
                const isOver = trip.status === 'over';
                
                return (
                  <div
                    key={trip.$id}
                    className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    {/* Trip Image/Header */}
                    <div 
                      className="h-48 bg-gradient-to-br from-skyneu-blue/20 to-skyneu-green/20 relative overflow-hidden cursor-pointer"
                      onClick={() => onSelectTrip(trip.$id!)}
                    >
                      {trip.image ? (
                        <img 
                          src={trip.image} 
                          alt={trip.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-12 w-12 text-skyneu-blue opacity-50" />
                        </div>
                      )}

                      {/* Action Buttons - Always visible for owned trips */}
                      {trip.isOwner && (
                        <div className="absolute top-3 right-3 flex gap-1 transition-opacity">
                          {/* Share Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareTrip(trip.$id!);
                            }}
                            className="p-2 bg-green-50/95 dark:bg-green-900/30 backdrop-blur-sm rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 shadow-sm hover:shadow-md border border-green-200/50 dark:border-green-700/50"
                            title="Share trip code"
                          >
                            <Share2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </button>
                          
                          {/* Photo Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowImagePicker(trip.$id!);
                            }}
                            className="p-2 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-dark-bg transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50"
                            title="Change photo"
                          >
                            <Camera className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                          </button>
                          
                          {/* Edit Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTrip(trip.$id!);
                            }}
                            className="p-2 bg-blue-50/95 dark:bg-blue-900/30 backdrop-blur-sm rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 shadow-sm hover:shadow-md border border-blue-200/50 dark:border-blue-700/50"
                            title="Edit trip details"
                          >
                            <Edit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(trip.$id!);
                            }}
                            className="p-2 bg-red-50/95 dark:bg-red-900/30 backdrop-blur-sm rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200 shadow-sm hover:shadow-md border border-red-200/50 dark:border-red-700/50"
                            title="Delete trip"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                          </button>
                          
                          {/* Status Menu Button */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStatus(editingStatus === trip.$id ? null : trip.$id!);
                              }}
                              className="p-2 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-dark-bg transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-700/50"
                              title="Change status"
                            >
                              <MoreVertical className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                            </button>
                            
                            {/* Dropdown Menu - Focus on Status Changes */}
                            {editingStatus === trip.$id && (
                              <div className="absolute top-8 right-0 bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[150px]">
                                <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">Change Status</div>
                                {['planning', 'confirmed', 'active', 'completed', 'cancelled', 'over'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(trip.$id!, status as Trip['status']);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${
                                      trip.status === status ? 'text-skyneu-blue bg-skyneu-blue/10' : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {trip.status === status && <CheckCircle className="h-3 w-3" />}
                                    <span className="capitalize">{status}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Status Badge - Now clickable for owned trips */}
                      <div className="absolute top-3 left-3">
                        {trip.isOwner ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStatus(editingStatus === trip.$id ? null : trip.$id!);
                            }}
                            className={`px-2 py-1 rounded-full text-xs font-medium hover:scale-105 transition-transform ${getStatusColor(trip.status || 'planning')}`}
                            title="Click to change status"
                          >
                            {(trip.status || 'planning').charAt(0).toUpperCase() + (trip.status || 'planning').slice(1)}
                          </button>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status || 'planning')}`}>
                            {(trip.status || 'planning').charAt(0).toUpperCase() + (trip.status || 'planning').slice(1)}
                          </span>
                        )}
                      </div>

                      {/* Enhanced Features Indicator */}
                      {trip.isOwner && (
                        <div className="absolute bottom-3 left-3 bg-skyneu-blue text-white px-2 py-1 rounded-full">
                          <span className="text-xs font-medium flex items-center gap-1">
                            <Settings className="h-3 w-3" />
                            Owner
                          </span>
                        </div>
                      )}

                      {/* Role Badge */}
                      {trip.userRole && trip.userRole !== 'member' && !trip.isOwner && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-dark-bg/90 px-2 py-1 rounded-full">
                          {getRoleIcon(trip.userRole)}
                          <span className="text-xs font-medium capitalize">{trip.userRole}</span>
                        </div>
                      )}

                      {/* Days Remaining */}
                      {isUpcoming && (
                        <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-dark-bg/90 px-2 py-1 rounded-full">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-orange-500" />
                            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                              {daysRemaining} days left
                            </span>
                          </div>
                        </div>
                      )}

                      {isActive && (
                        <div className="absolute bottom-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full">
                          <span className="text-xs font-medium">Active Trip</span>
                        </div>
                      )}

                      {isOver && (
                        <div className="absolute bottom-3 right-3 bg-slate-500 text-white px-2 py-1 rounded-full">
                          <span className="text-xs font-medium">Trip Over</span>
                        </div>
                      )}
                    </div>

                    {/* Trip Details */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => onSelectTrip(trip.$id!)}
                    >
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {trip.title}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{trip.destination}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          <span>{trip.memberCount} member{trip.memberCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {trip.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {trip.description}
                        </p>
                      )}

                      {/* Action Button */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {trip.isOwner ? 'Owned by you' : `Joined as ${trip.userRole}`}
                        </div>
                        <div className="flex items-center gap-1 text-skyneu-blue group-hover:translate-x-1 transition-transform duration-200">
                          <span className="text-sm font-medium">View Details</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Unsplash Image Picker Modal */}
          {showImagePicker && (
            <UnsplashImagePicker
              isOpen={!!showImagePicker}
              onClose={() => setShowImagePicker(null)}
              onImageSelect={(imageUrl) => handleUpdateTripImage(showImagePicker, imageUrl)}
              searchQuery={trips.find(t => t.$id === showImagePicker)?.destination || 'travel'}
            />
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-dark-surface rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Trip</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete this trip? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTrip(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Join Trip Modal */}
          {showJoinModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-dark-surface rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-500" />
                  Join Trip with Code
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Enter the 6-character trip code to join an existing trip.
                </p>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trip Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-center text-lg font-mono tracking-widest uppercase"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleJoinTrip();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Ask the trip organizer for the join code
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowJoinModal(false);
                      setJoinCode('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinTrip}
                    disabled={!joinCode.trim() || joinCode.length !== 6 || joiningTrip}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {joiningTrip ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Joining...
                      </>
                    ) : (
                      'Join Trip'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Share Trip Modal */}
          {showShareModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-dark-surface rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-green-500" />
                  Share Trip
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Share this trip with others. Choose how they can join:
                </p>
                
                {/* Member Join Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Member Join Code (Requires Account)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareCode}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg font-mono tracking-widest"
                    />
                    <button
                      onClick={() => copyToClipboard(shareCode)}
                      className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Members need to create an account to join
                  </p>
                </div>

                {/* Guest Link */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Viewer Access Link (Free Account Required)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/trip/guest/${shareCode}`}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/trip/guest/${shareCode}`)}
                      className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                      title="Copy guest link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    🔐 Users need to create a free account to join (no subscription required)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowShareModal(null)}
                    className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => regenerateJoinCode(showShareModal)}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Generate New Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template Picker Modal */}
          <TripTemplatePicker
            isOpen={showTemplatePicker}
            onClose={() => setShowTemplatePicker(false)}
            onSelectTemplate={handleTemplateSelect}
          />
        </div>
      </main>
    </div>
  );
};

export default TripListPage;
