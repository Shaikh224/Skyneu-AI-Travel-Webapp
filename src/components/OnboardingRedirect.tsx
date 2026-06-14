import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AppwriteAuthContext';

const OnboardingRedirect: React.FC = () => {
  const { isAuthenticated, needsOnboarding, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!isAuthenticated) {
      // User not logged in, redirect to signup
      navigate('/profile');
      return;
    }

    if (needsOnboarding) {
      // New user needs onboarding, redirect to profile setup
      navigate('/profile');
      return;
    }

    // Existing user, redirect to AI planner
    navigate('/ai-chat');
  }, [isAuthenticated, needsOnboarding, loading, navigate]);

  // Show loading while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skyneu-blue mx-auto mb-4"></div>
        <p className="text-skyneu-text dark:text-dark-text-secondary">Setting up your experience...</p>
      </div>
    </div>
  );
};

export default OnboardingRedirect;
