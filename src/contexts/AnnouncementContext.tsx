import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getActiveAnnouncements } from '../lib/queries';
import type { Announcement } from '../types/sanity';

interface AnnouncementContextType {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  dismissAnnouncement: (id: string) => void;
  refreshAnnouncements: () => Promise<void>;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

interface AnnouncementProviderProps {
  children: ReactNode;
}

export const AnnouncementProvider: React.FC<AnnouncementProviderProps> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const getCurrentPage = () => {
    const path = location.pathname;
    
    // Map routes to page identifiers
    if (path === '/') return 'home';
    if (path.startsWith('/changelog')) return 'changelog';
    if (path.startsWith('/roadmap')) return 'roadmap';
    if (path.startsWith('/aviation-education') || path.startsWith('/guides')) return 'guides';
    if (path.startsWith('/quiz')) return 'quizzes';
    if (path.startsWith('/resources')) return 'resources';
    
    return 'all'; // Default to show on all pages
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load announcements from Sanity
      const currentPage = getCurrentPage();
      console.log('Loading announcements for page:', currentPage);
      
      const data = await getActiveAnnouncements(currentPage);
      console.log('Loaded announcements from Sanity:', data);
      
      // Don't filter dismissed announcements here - let the banner component handle it
      // This prevents double filtering issues
      setAnnouncements(data);
    } catch (err) {
      console.error('Error loading announcements:', err);
      // Don't set error for announcements - just use empty array
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const dismissAnnouncement = useCallback((id: string) => {
    setAnnouncements(prev => prev.filter(announcement => announcement._id !== id));
  }, []);

  const refreshAnnouncements = useCallback(async () => {
    await loadAnnouncements();
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [location.pathname]); // Reload when page changes

  // Refresh announcements every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadAnnouncements();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const value: AnnouncementContextType = useMemo(() => ({
    announcements,
    loading,
    error,
    dismissAnnouncement,
    refreshAnnouncements,
  }), [announcements, loading, error, dismissAnnouncement, refreshAnnouncements]);

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = (): AnnouncementContextType => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
};
