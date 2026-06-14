import React, { useState } from 'react';
import { Users, Crown, Shield, Settings, UserCheck, UserX, Key, Copy, MoreHorizontal, Eye, EyeOff, Share2 } from 'lucide-react';
import { Trip, TripMember } from '../../types/trip';
import { UserPreferences } from '../../lib/appwrite';
import { tripService } from '../../services/tripService';
import { useAuthSafe } from '../../contexts/AppwriteAuthContext';
import MemberPreferencesCard from './MemberPreferencesCard';
import toast from 'react-hot-toast';

interface TripMembersTabProps {
  trip: Trip;
  members: TripMember[];
  userRole: string;
  onRefresh: () => void;
  memberPreferences?: { [userId: string]: UserPreferences };
}

const TripMembersTab: React.FC<TripMembersTabProps> = ({
  trip,
  members,
  userRole,
  onRefresh,
  memberPreferences = {}
}) => {
  const authContext = useAuthSafe();
  const user = authContext?.user;
  const userPreferences = authContext?.userPreferences;
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState<{ [userId: string]: boolean }>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState('');

  const togglePreferences = (userId: string) => {
    setShowPreferences(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const summarizePreferences = (preferences: UserPreferences): string => {
    const parts: string[] = [];
    
    // Travel style
    if (preferences.travelStyle) {
      parts.push(`${preferences.travelStyle} traveler`);
    }
    
    // Budget preference
    if (preferences.budgetRange) {
      parts.push(`${preferences.budgetRange.toLowerCase()} budget`);
    }
    
    // Top interests (limit to 3)
    if (preferences.interests) {
      let interests: string[] = [];
      try {
        interests = typeof preferences.interests === 'string' 
          ? JSON.parse(preferences.interests) 
          : preferences.interests;
      } catch {
        interests = Array.isArray(preferences.interests) ? preferences.interests : [];
      }
      
      if (interests.length > 0) {
        const topInterests = interests.slice(0, 3);
        parts.push(`enjoys ${topInterests.join(', ')}`);
      }
    }
    
    // Accommodation preference
    if (preferences.accommodationType) {
      parts.push(`prefers ${preferences.accommodationType.toLowerCase()}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No preferences set';
  };

  const getGroupPreferenceStats = () => {
    const allPreferences = Object.values(memberPreferences);
    if (userPreferences) {
      allPreferences.push(userPreferences);
    }

    if (allPreferences.length === 0) return null;

    const stats = {
      travelStyles: {} as Record<string, number>,
      budgetRanges: {} as Record<string, number>,
      topInterests: {} as Record<string, number>,
      accommodationTypes: {} as Record<string, number>
    };

    allPreferences.forEach(pref => {
      // Travel styles
      if (pref.travelStyle) {
        stats.travelStyles[pref.travelStyle] = (stats.travelStyles[pref.travelStyle] || 0) + 1;
      }

      // Budget ranges
      if (pref.budgetRange) {
        stats.budgetRanges[pref.budgetRange] = (stats.budgetRanges[pref.budgetRange] || 0) + 1;
      }

      // Interests
      if (pref.interests) {
        let interests: string[] = [];
        try {
          interests = typeof pref.interests === 'string' 
            ? JSON.parse(pref.interests) 
            : pref.interests;
        } catch {
          interests = Array.isArray(pref.interests) ? pref.interests : [];
        }
        
        interests.forEach(interest => {
          stats.topInterests[interest] = (stats.topInterests[interest] || 0) + 1;
        });
      }

      // Accommodation types
      if (pref.accommodationType) {
        stats.accommodationTypes[pref.accommodationType] = (stats.accommodationTypes[pref.accommodationType] || 0) + 1;
      }
    });

    return stats;
  };

  const canManageMembers = ['owner', 'admin'].includes(userRole);
  const canInvite = ['owner', 'admin', 'co-admin'].includes(userRole);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-purple-500" />;
      case 'co-admin': return <Settings className="h-4 w-4 text-blue-500" />;
      case 'member': return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'viewer': return <Users className="h-4 w-4 text-gray-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'co-admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'member': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'owner': return 'Full control of the trip';
      case 'admin': return 'Manage members, edit trip details';
      case 'co-admin': return 'Edit activities and expenses';
      case 'member': return 'Add activities and expenses';
      case 'viewer': return 'View only access';
      default: return 'Basic access';
    }
  };

  const handleCopyJoinCode = async () => {
    if (trip.joinCode) {
      await navigator.clipboard.writeText(trip.joinCode);
      toast.success('Join code copied to clipboard!');
    }
  };

  const handleShareTrip = async () => {
    try {
      // Enable join code if not already enabled
      if (!trip.joinCodeEnabled) {
        await tripService.toggleJoinCode(trip.$id!, true);
        toast.success('Join code activated!');
      }
      
      setShareCode(trip.joinCode || '');
      setShowShareModal(true);
    } catch (error) {
      console.error('Error getting share code:', error);
      toast.error('Failed to get share code');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Copied to clipboard!');
    }
  };

  const handleToggleJoinCode = async () => {
    if (!canManageMembers) return;

    try {
      await tripService.toggleJoinCode(trip.$id!, !trip.joinCodeEnabled);
      toast.success(trip.joinCodeEnabled ? 'Join code disabled' : 'Join code enabled');
      onRefresh();
    } catch (error) {
      console.error('Error toggling join code:', error);
      toast.error('Failed to toggle join code');
    }
  };

  const handleRegenerateJoinCode = async () => {
    if (!canManageMembers) return;

    try {
      await tripService.regenerateJoinCode(trip.$id!);
      toast.success('New join code generated');
      onRefresh();
    } catch (error) {
      console.error('Error regenerating join code:', error);
      toast.error('Failed to generate new code');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!canManageMembers) return;
    if (newRole === 'owner') {
      toast.error('Cannot assign owner role');
      return;
    }

    // Find the member to check their current role
    const member = members.find(m => m.$id === memberId);
    if (member && member.role === 'viewer') {
      toast.error('Cannot change viewer role - viewers must remain as viewers');
      return;
    }

    try {
      await tripService.updateMemberRole(memberId, newRole as 'admin' | 'co-admin' | 'member' | 'viewer');
      toast.success('Member role updated');
      setShowRoleModal(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!canManageMembers) return;
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await tripService.removeMember(memberId);
        toast.success('Member removed');
        onRefresh();
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove member');
      }
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, 'co-admin': 2, member: 3, viewer: 4 };
    return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Members Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              👥 Trip Members
              <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                ({members.length} members)
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Manage your travel companions and their permissions
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3 text-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {members.filter(m => m.role === 'owner').length} Owner
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {members.filter(m => m.role === 'admin').length} Admins
                </span>
              </div>
              <div className="flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {members.filter(m => m.role === 'member').length} Members
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {members.filter(m => m.role === 'viewer').length} Viewers
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {canInvite && (
              <button
                onClick={() => {
                  setShowJoinCode(true);
                  handleShareTrip(); // Also open share modal
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium"
              >
                <Share2 className="h-5 w-5" />
                <span>Generate & Share Join Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Role Permissions Guide */}
        {canManageMembers && (
          <div className="mt-4 p-4 bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">🔐 Role Permissions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">Owner</span>
                </div>
                <ul className="text-gray-600 dark:text-gray-400 space-y-0.5">
                  <li>• Full trip control</li>
                  <li>• Manage all members</li>
                  <li>• Delete trip</li>
                  <li>• Transfer ownership</li>
                </ul>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-purple-500" />
                  <span className="font-medium">Admin</span>
                </div>
                <ul className="text-gray-600 dark:text-gray-400 space-y-0.5">
                  <li>• Manage activities</li>
                  <li>• Manage expenses</li>
                  <li>• Invite members</li>
                  <li>• Assign roles</li>
                </ul>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Settings className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">Co-Admin</span>
                </div>
                <ul className="text-gray-600 dark:text-gray-400 space-y-0.5">
                  <li>• Add activities</li>
                  <li>• Add expenses</li>
                  <li>• Invite members</li>
                  <li>• Vote on activities</li>
                </ul>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-green-500" />
                  <span className="font-medium">Member/Viewer</span>
                </div>
                <ul className="text-gray-600 dark:text-gray-400 space-y-0.5">
                  <li>• View trip details</li>
                  <li>• Vote on activities</li>
                  <li>• Add personal expenses</li>
                  <li>• Comment & discuss</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group Preference Overview */}
      {(() => {
        const stats = getGroupPreferenceStats();
        if (!stats) return null;

        return (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Group Travel Preferences
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Overview of your group's travel style and preferences
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Travel Styles */}
              {Object.keys(stats.travelStyles).length > 0 && (
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    🧳 Travel Styles
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(stats.travelStyles)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([style, count]) => (
                        <div key={style} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {style}
                          </span>
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Budget Ranges */}
              {Object.keys(stats.budgetRanges).length > 0 && (
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    💰 Budget Preferences
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(stats.budgetRanges)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([budget, count]) => (
                        <div key={budget} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {budget}
                          </span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Top Interests */}
              {Object.keys(stats.topInterests).length > 0 && (
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    ⭐ Popular Interests
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(stats.topInterests)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([interest, count]) => (
                        <div key={interest} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {interest}
                          </span>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Accommodation Preferences */}
              {Object.keys(stats.accommodationTypes).length > 0 && (
                <div className="bg-white dark:bg-dark-surface rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    🏨 Accommodation
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(stats.accommodationTypes)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {type}
                          </span>
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2">
              💡 Use these insights to plan activities that match your group's preferences!
            </div>
          </div>
        );
      })()}

      {/* Members List */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="p-6">
          <div className="space-y-4">
            {sortedMembers.map((member) => {
              const isCurrentUser = member.userId === user?.$id;
              const canEditMember = canManageMembers && !isCurrentUser && member.role !== 'owner';
              
              return (
                <div key={member.$id} className="space-y-2">
                  <div
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentUser 
                        ? 'border-skyneu-blue/30 bg-skyneu-blue/5 dark:bg-skyneu-blue/10' 
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.name || 'User'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {/* Role Badge */}
                        <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-dark-surface rounded-full">
                          {getRoleIcon(member.role)}
                        </div>
                      </div>

                      {/* Member Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {member.name || member.email}
                            {isCurrentUser && <span className="text-sm text-gray-500">(You)</span>}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getRolePermissions(member.role)}
                          </span>
                        </div>

                        {member.email && member.name && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {member.email}
                          </div>
                        )}

                        {member.joinedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        )}

                        {/* Preference Summary */}
                        {(memberPreferences[member.userId] || (isCurrentUser && userPreferences)) && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md max-w-xs">
                            <span className="font-medium">Preferences:</span> {
                              summarizePreferences(
                                (isCurrentUser && userPreferences) 
                                  ? userPreferences 
                                  : memberPreferences[member.userId]
                              )
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {member.status && member.status !== 'active' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {member.status}
                        </span>
                      )}

                      {/* Preferences Toggle */}
                      {(memberPreferences[member.userId] || (isCurrentUser && userPreferences)) && (
                        <button
                          onClick={() => togglePreferences(member.userId)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="View travel preferences"
                        >
                          {showPreferences[member.userId] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      {canEditMember && (
                        <div className="relative">
                          <button
                            onClick={() => setShowRoleModal(member.$id!)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member Preferences Display */}
                  {showPreferences[member.userId] && (
                    <div className="ml-16">
                      {(() => {
                        const preferences = isCurrentUser && userPreferences 
                          ? userPreferences 
                          : memberPreferences[member.userId];
                        
                        if (preferences) {
                          return (
                            <MemberPreferencesCard 
                              preferences={preferences}
                              isCurrentUser={isCurrentUser}
                              compact={true}
                            />
                          );
                        } else {
                          return (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No preferences available for this member
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Join Code Modal */}
      {showJoinCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Trip Join Code
                </h3>
                <button
                  onClick={() => setShowJoinCode(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <UserX className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share this code with people you want to join your trip
                </p>

                {trip.joinCode && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <code className="flex-1 text-lg font-mono font-bold text-gray-900 dark:text-white text-center">
                      {trip.joinCode}
                    </code>
                    <button
                      onClick={handleCopyJoinCode}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Join Code Status
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      {trip.joinCodeEnabled ? 'Active - anyone with code can join' : 'Disabled - code cannot be used'}
                    </div>
                  </div>
                  {canManageMembers && (
                    <button
                      onClick={handleToggleJoinCode}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        trip.joinCodeEnabled
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {trip.joinCodeEnabled ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </div>

                {canManageMembers && trip.joinCodeEnabled && (
                  <button
                    onClick={handleRegenerateJoinCode}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                  >
                    Generate New Code
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              {(() => {
                const member = members.find(m => m.$id === showRoleModal);
                if (!member) return null;

                return (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Manage {member.name || member.email}
                    </h3>

                    {member.role === 'viewer' && (
                      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                          <Shield className="h-4 w-4" />
                          <span className="text-sm font-medium">Viewer Role Protected</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Viewers cannot be promoted or have their role changed. They joined via shared link with limited access.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Current role: <span className="font-medium capitalize">{member.role}</span>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Change Role
                        </label>
                        {['viewer', 'member', 'co-admin', ...(userRole === 'owner' ? ['admin'] : [])].map(role => {
                          const isViewer = member.role === 'viewer';
                          const isCurrentRole = role === member.role;
                          const isDisabled = isCurrentRole || isViewer;
                          
                          return (
                            <button
                              key={role}
                              onClick={() => handleUpdateRole(member.$id!, role)}
                              disabled={isDisabled}
                              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                                isCurrentRole
                                  ? 'border-skyneu-blue bg-skyneu-blue/10 text-skyneu-blue cursor-not-allowed'
                                  : isViewer
                                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {getRoleIcon(role)}
                                <div>
                                  <div className="font-medium capitalize">{role}</div>
                                  <div className="text-xs text-gray-500">
                                    {isViewer && !isCurrentRole ? 'Viewers cannot be promoted' : getRolePermissions(role)}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleRemoveMember(member.$id!)}
                          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                        >
                          Remove from Trip
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowRoleModal(null)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
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
                Guest Access Link (No Account Required)
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
                🎉 Guests can view trip, vote on activities, and add personal expenses
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripMembersTab;
