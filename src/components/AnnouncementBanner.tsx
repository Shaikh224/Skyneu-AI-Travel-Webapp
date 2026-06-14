import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Info, CheckCircle, AlertTriangle, XCircle, Sparkles, Wrench, PartyPopper, Clock, Star } from 'lucide-react';
import { useAnnouncements } from '../contexts/AnnouncementContext';
import type { Announcement } from '../types/sanity';

interface AnnouncementBannerProps {
  page: string;
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ page }) => {
  const { announcements, dismissAnnouncement } = useAnnouncements();
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<Announcement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Debounce to prevent rapid updates during HMR
    const timeoutId = setTimeout(() => {
      try {
        // Filter announcements for this specific page
        const pageAnnouncements = announcements.filter(announcement => 
          announcement && announcement.showOnPages && 
          (announcement.showOnPages.includes(page) || announcement.showOnPages.includes('all'))
        );

        // Filter out dismissed announcements (with expiration check)
        const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
        const now = Date.now();
        
        // Clean up expired dismissals
        const validDismissals = dismissedAnnouncements.filter((dismissal: any) => {
          if (typeof dismissal === 'string') {
            // Legacy format - keep for backward compatibility
            return true;
          }
          return dismissal.expiresAt && dismissal.expiresAt > now;
        });
        
        // Update localStorage if we cleaned up expired dismissals
        if (validDismissals.length !== dismissedAnnouncements.length) {
          localStorage.setItem('dismissedAnnouncements', JSON.stringify(validDismissals));
        }
        
        const dismissedIds = validDismissals.map((d: any) => typeof d === 'string' ? d : d.id);
        const filteredAnnouncements = pageAnnouncements.filter(announcement => 
          announcement && announcement._id && !dismissedIds.includes(announcement._id)
        );

        setVisibleAnnouncements(filteredAnnouncements);
        setIsInitialized(true);
        
        // Debug logging
        console.log('Announcement filtering:', {
          totalAnnouncements: announcements.length,
          pageAnnouncements: pageAnnouncements.length,
          dismissedCount: dismissedIds.length,
          visibleCount: filteredAnnouncements.length,
          dismissedIds: dismissedIds,
          announcements: announcements,
          page: page
        });
      } catch (error) {
        console.error('Error filtering announcements:', error);
        setVisibleAnnouncements([]);
        setIsInitialized(true);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [announcements, page]);

  // Add/remove body class for announcement presence
  useEffect(() => {
    if (!isInitialized) return; // Don't update body class until initialized
    
    if (visibleAnnouncements.length > 0) {
      document.body.classList.add('announcement-present');
    } else {
      document.body.classList.remove('announcement-present');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('announcement-present');
    };
  }, [visibleAnnouncements.length, isInitialized]);

  const handleDismiss = (announcement: Announcement) => {
    if (announcement.dismissible) {
      dismissAnnouncement(announcement._id);
      
      // Store in localStorage with timestamp for potential future expiration
      const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
      const dismissalRecord = {
        id: announcement._id,
        dismissedAt: Date.now(),
        // Optional: Add expiration (e.g., 7 days)
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
      
      // Remove any existing dismissal for this announcement
      const filteredDismissals = dismissedAnnouncements.filter((d: any) => d.id !== announcement._id);
      filteredDismissals.push(dismissalRecord);
      
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(filteredDismissals));
      
      console.log('Announcement dismissed:', announcement.title, 'ID:', announcement._id);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      info: <Info className="h-4 w-4" />,
      success: <CheckCircle className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
      error: <XCircle className="h-4 w-4" />,
      feature: <Sparkles className="h-4 w-4" />,
      maintenance: <Wrench className="h-4 w-4" />,
      promotion: <PartyPopper className="h-4 w-4" />,
    };
    return icons[type as keyof typeof icons] || <Info className="h-4 w-4" />;
  };

  const getColorClasses = (type: string, backgroundColor: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
        border: 'border-l-4 border-blue-500',
        text: 'text-blue-900 dark:text-blue-100',
        icon: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
        badge: 'bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200',
      },
      green: {
        bg: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20',
        border: 'border-l-4 border-green-500',
        text: 'text-green-900 dark:text-green-100',
        icon: 'text-green-600 dark:text-green-400',
        button: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
        badge: 'bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200',
      },
      yellow: {
        bg: 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20',
        border: 'border-l-4 border-yellow-500',
        text: 'text-yellow-900 dark:text-yellow-100',
        icon: 'text-yellow-600 dark:text-yellow-400',
        button: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm',
        badge: 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200',
      },
      red: {
        bg: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20',
        border: 'border-l-4 border-red-500',
        text: 'text-red-900 dark:text-red-100',
        icon: 'text-red-600 dark:text-red-400',
        button: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
        badge: 'bg-red-100 dark:bg-red-800/50 text-red-800 dark:text-red-200',
      },
      purple: {
        bg: 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20',
        border: 'border-l-4 border-purple-500',
        text: 'text-purple-900 dark:text-purple-100',
        icon: 'text-purple-600 dark:text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm',
        badge: 'bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200',
      },
      gray: {
        bg: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20',
        border: 'border-l-4 border-gray-500',
        text: 'text-gray-900 dark:text-gray-100',
        icon: 'text-gray-600 dark:text-gray-400',
        button: 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm',
        badge: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200',
      },
    };

    return colorMap[backgroundColor as keyof typeof colorMap] || colorMap.blue;
  };

  const getPriorityStyles = (priority: string) => {
    const styles = {
      critical: 'animate-pulse shadow-lg ring-2 ring-red-500/20',
      high: 'shadow-md ring-1 ring-blue-500/20',
      medium: 'shadow-sm',
      low: '',
    };
    return styles[priority as keyof typeof styles] || '';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical') return <AlertTriangle className="h-3 w-3" />;
    if (priority === 'high') return <Star className="h-3 w-3" />;
    return null;
  };

  // Don't render until initialized to prevent blinking
  if (!isInitialized) return null;
  
  if (!visibleAnnouncements || visibleAnnouncements.length === 0) return null;

  // Debug function to clear all dismissals (for testing)
  const clearAllDismissals = () => {
    localStorage.removeItem('dismissedAnnouncements');
    console.log('All dismissals cleared');
    window.location.reload();
  };

  // Add debug button in development
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] announcement-banner">
      {visibleAnnouncements.map((announcement) => {
        if (!announcement) return null;
        const colors = getColorClasses(announcement.type, announcement.backgroundColor);
        const priorityStyles = getPriorityStyles(announcement.priority);
        
        // Debug logging
        console.log('Rendering announcement:', announcement.title, 'dismissible:', announcement.dismissible);

        return (
          <div
            key={announcement._id}
            className={`relative ${colors.border} ${colors.bg} ${priorityStyles} transition-all duration-300 ease-in-out backdrop-blur-sm ${
              announcement.customCSS ? announcement.customCSS : ''
            }`}
          >
            <div className="px-4 py-3 sm:px-6 lg:px-8 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 ${colors.icon}`}>
                    {getTypeIcon(announcement.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-sm font-semibold ${colors.text} truncate`}>
                        {announcement.title}
                      </h3>
                      {announcement.priority && announcement.priority !== 'low' && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                          {getPriorityIcon(announcement.priority)}
                          <span className="ml-1 capitalize">{announcement.priority}</span>
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${colors.text} opacity-90 line-clamp-1`}>
                      {announcement.message}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                  {announcement.actionButton && (
                    <a
                      href={announcement.actionButton.url}
                      target={announcement.actionButton.openInNewTab ? '_blank' : '_self'}
                      rel={announcement.actionButton.openInNewTab ? 'noopener noreferrer' : ''}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${colors.button} hover:shadow-md transform hover:scale-105`}
                    >
                      {announcement.actionButton.text}
                      {announcement.actionButton.openInNewTab && (
                        <ExternalLink className="ml-1.5 h-3 w-3" />
                      )}
                    </a>
                  )}
                </div>
                
                {/* Dismiss button positioned on the far right - always show for testing */}
                <button
                  onClick={() => handleDismiss(announcement)}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 flex-shrink-0 z-10 border border-gray-200 dark:border-gray-600 shadow-sm"
                  aria-label="Dismiss announcement"
                  style={{ minWidth: '32px', minHeight: '32px' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
