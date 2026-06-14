import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { authService } from '@/lib/appwrite';
import { CheckCircle, Loader } from 'lucide-react';

const AuthSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait a moment for the OAuth session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user is authenticated
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          // Check for returnUrl parameter
          const returnUrl = searchParams.get('returnUrl');
          if (returnUrl) {
            // Redirect to the return URL (e.g., trip guest page)
            navigate(returnUrl);
          } else {
            // User is authenticated, redirect to home
            navigate('/');
          }
        } else {
          // Something went wrong, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-surface">
      <div className="max-w-md w-full bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-skyneu-dark dark:text-dark-text mb-2">
            Authentication Successful!
          </h1>
          <p className="text-skyneu-text dark:text-dark-text-secondary">
            You have been successfully signed in. Redirecting...
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-skyneu-blue">
          <Loader className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Please wait...</span>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;
