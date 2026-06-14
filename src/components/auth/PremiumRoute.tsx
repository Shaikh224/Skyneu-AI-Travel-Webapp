import React from 'react';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import PremiumLock from '@/components/common/PremiumLock';

interface PremiumRouteProps {
  children: React.ReactNode;
  feature: string;
}

const PremiumRoute: React.FC<PremiumRouteProps> = ({ children, feature }) => {
  const { user, loading } = useAuth();
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skyneu-blue"></div>
      </div>
    );
  }
  
  // Check premium label directly from user object
  const hasPremium = user?.labels?.includes('premium') || false;
  
  if (!hasPremium) {
    return <PremiumLock feature={feature} />;
  }
  
  return <>{children}</>;
};

export default PremiumRoute;
