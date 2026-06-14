import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Simulate user engagement based loading time
    // Random duration between 3-6 seconds for more realistic feel
    const loadingDuration = 3000 + Math.random() * 3000;
    
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }, loadingDuration);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  const setLoading = (loading: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(loading);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
