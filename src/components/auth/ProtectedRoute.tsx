import React from 'react';
import { useAuthSafe } from '@/contexts/AppwriteAuthContext';
import { Lock, Sparkles, Users, Brain, Zap, Shield } from 'lucide-react';
import AppwriteAuthModal from './AppwriteAuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const authContext = useAuthSafe();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  
  // Handle case where auth context is not available during hot reload
  if (!authContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-skyneu-blue/20 to-skyneu-green/20 dark:from-skyneu-blue/30 dark:to-skyneu-green/30 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="h-8 w-8 text-skyneu-blue" />
          </div>
          <div className="text-lg font-semibold text-skyneu-dark dark:text-dark-text">Loading...</div>
        </div>
      </div>
    );
  }
  
  const { isAuthenticated, loading } = authContext;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-skyneu-blue/20 to-skyneu-green/20 dark:from-skyneu-blue/30 dark:to-skyneu-green/30 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="h-8 w-8 text-skyneu-blue" />
          </div>
          <div className="text-lg font-semibold text-skyneu-dark dark:text-dark-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Lock Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-skyneu-blue/20 to-skyneu-green/20 dark:from-skyneu-blue/30 dark:to-skyneu-green/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Lock className="h-12 w-12 text-skyneu-blue" />
            </div>

            {/* Main Message */}
            <h1 className="font-bold text-3xl sm:text-4xl text-skyneu-dark dark:text-dark-text mb-4">
              Premium Features Await
            </h1>
            <p className="text-lg text-skyneu-text dark:text-dark-text-secondary mb-8 max-w-xl mx-auto">
              Sign in to unlock AI-powered travel tools, smart planning features, and personalized recommendations.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 dark:border-dark-border shadow-lg">
                <div className="w-12 h-12 bg-skyneu-blue/10 dark:bg-skyneu-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-skyneu-blue" />
                </div>
                <h3 className="font-semibold text-skyneu-dark dark:text-dark-text mb-2">AI Flight Search</h3>
                <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">Smart recommendations and price predictions</p>
              </div>

              <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 dark:border-dark-border shadow-lg">
                <div className="w-12 h-12 bg-skyneu-green/10 dark:bg-skyneu-green/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-skyneu-green" />
                </div>
                <h3 className="font-semibold text-skyneu-dark dark:text-dark-text mb-2">Visa Intelligence</h3>
                <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">Real-time requirements and document scanning</p>
              </div>

              <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 dark:border-dark-border shadow-lg sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 bg-skyneu-blue/10 dark:bg-skyneu-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-skyneu-blue" />
                </div>
                <h3 className="font-semibold text-skyneu-dark dark:text-dark-text mb-2">Group Planning</h3>
                <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">Collaborative trip planning with smart budgeting</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-skyneu-blue to-skyneu-blue/80 text-white rounded-2xl font-semibold hover:from-skyneu-blue/90 hover:to-skyneu-blue/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Zap className="h-5 w-5" />
                <span>Sign In to Continue</span>
              </button>
              
              <button
                onClick={() => window.location.hash = ''}
                className="px-8 py-4 border-2 border-skyneu-blue dark:border-skyneu-blue text-skyneu-blue dark:text-skyneu-blue rounded-2xl font-semibold hover:bg-skyneu-blue hover:text-white dark:hover:bg-skyneu-blue dark:hover:text-white transition-all duration-300"
              >
                Back to Home
              </button>
            </div>

          </div>
        </div>

        {showAuthModal && (
          <AppwriteAuthModal
            isOpen={showAuthModal}
            type="login"
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;