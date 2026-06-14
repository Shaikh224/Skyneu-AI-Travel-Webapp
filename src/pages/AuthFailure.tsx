import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const AuthFailure: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to login after 5 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-surface">
      <div className="max-w-md w-full bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-skyneu-dark dark:text-dark-text mb-2">
            Authentication Failed
          </h1>
          <p className="text-skyneu-text dark:text-dark-text-secondary mb-6">
            We couldn't complete your sign-in. This might be due to:
          </p>
          <ul className="text-left text-sm text-skyneu-text dark:text-dark-text-secondary space-y-2 mb-6">
            <li>• You cancelled the authentication process</li>
            <li>• There was a network error</li>
            <li>• The authentication service is temporarily unavailable</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Try Again
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-dark dark:hover:text-dark-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
        
        <p className="text-xs text-skyneu-text dark:text-dark-text-secondary mt-4">
          You will be automatically redirected in a few seconds...
        </p>
      </div>
    </div>
  );
};

export default AuthFailure;
