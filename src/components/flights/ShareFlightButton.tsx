/**
 * Share Flight Button Component
 * Allows users to create and manage shareable flight links
 */

import React, { useState } from 'react';
import { Share2, Copy, Check, User, MapPin, Eye, EyeOff, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { shareCardService, CreateShareCardData, ShareCard } from '@/services/shareCardService';
import { SavedFlight } from '@/lib/appwrite';

interface ShareFlightButtonProps {
  flight: SavedFlight;
  userId: string;
}

export const ShareFlightButton: React.FC<ShareFlightButtonProps> = ({ flight, userId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [shareCards, setShareCards] = useState<ShareCard[]>([]);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  
  // Form state
  const [formData, setFormData] = useState({
    expires_at: '',
    allow_name: false,
    allow_seat: false,
    custom_message: '',
  });

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    // Load existing share cards for this flight
    await loadShareCards();
  };

  const loadShareCards = async () => {
    try {
      const allCards = await shareCardService.getUserShareCards(userId);
      const flightCards = allCards.filter(card => card.flight_ref === flight.$id);
      setShareCards(flightCards);
    } catch (error) {
      console.error('Failed to load share cards:', error);
      toast.error('Failed to load existing share links');
    }
  };

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expires_at) {
      toast.error('Please select an expiration date');
      return;
    }

    setIsCreating(true);
    try {
      const shareData: CreateShareCardData = {
        flight_ref: flight.$id!,
        expires_at: formData.expires_at,
        allow_name: formData.allow_name,
        allow_seat: formData.allow_seat,
        custom_message: formData.custom_message,
      };

      const newCard = await shareCardService.createShareCard(shareData, userId);
      setShareCards([newCard, ...shareCards]);
      
      // Reset form
      setFormData({
        expires_at: '',
        allow_name: false,
        allow_seat: false,
        custom_message: '',
      });
      
      toast.success('Share link created successfully!');
    } catch (error) {
      console.error('Failed to create share card:', error);
      toast.error('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async (card: ShareCard) => {
    try {
      const shareUrl = shareCardService.generateShareUrl(card.slug);
      await navigator.clipboard.writeText(shareUrl);
      
      setCopiedStates({ ...copiedStates, [card.$id!]: true });
      toast.success('Link copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [card.$id!]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleToggleStatus = async (card: ShareCard) => {
    try {
      const newStatus = card.status === 'active' ? 'paused' : 'active';
      const updatedCard = await shareCardService.updateShareCardStatus(card.$id!, newStatus);
      
      setShareCards(shareCards.map(c => 
        c.$id === card.$id ? updatedCard : c
      ));
      
      toast.success(`Link ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      console.error('Failed to update share card status:', error);
      toast.error('Failed to update link status');
    }
  };

  const handleDeleteCard = async (card: ShareCard) => {
    try {
      await shareCardService.deleteShareCard(card.$id!);
      setShareCards(shareCards.filter(c => c.$id !== card.$id));
      toast.success('Share link deleted');
    } catch (error) {
      console.error('Failed to delete share card:', error);
      toast.error('Failed to delete share link');
    }
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Share Flight
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {flight.flightNumber} • {flight.departure?.airport} → {flight.arrival?.airport}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Create New Share Link Form */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Create New Share Link
                </h4>
                <form onSubmit={handleCreateShare} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Link Expires On
                    </label>
                    <input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Custom Message (Optional)
                    </label>
                    <textarea
                      value={formData.custom_message}
                      onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                      placeholder="Add a personal message to share with your flight status..."
                      rows={3}
                      maxLength={200}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                      {formData.custom_message.length}/200
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.allow_name}
                        onChange={(e) => setFormData({ ...formData, allow_name: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Show passenger initials
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.allow_seat}
                        onChange={(e) => setFormData({ ...formData, allow_seat: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Show seat number
                      </span>
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    {isCreating ? 'Creating...' : 'Create Share Link'}
                  </button>
                </form>
              </div>

              {/* Existing Share Links */}
              {shareCards.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Existing Share Links ({shareCards.length})
                  </h4>
                  <div className="space-y-3">
                    {shareCards.map((card) => (
                      <div
                        key={card.$id}
                        className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              card.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : card.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {card.status}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Expires: {formatExpiryDate(card.expires_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(card)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title={card.status === 'active' ? 'Pause link' : 'Activate link'}
                            >
                              {card.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Delete link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          {card.allow_name && (
                            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <User className="w-3 h-3" />
                              Name
                            </span>
                          )}
                          {card.allow_seat && (
                            <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <MapPin className="w-3 h-3" />
                              Seat
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleCopyLink(card)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-550 transition-colors duration-200"
                        >
                          {copiedStates[card.$id!] ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Link
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
