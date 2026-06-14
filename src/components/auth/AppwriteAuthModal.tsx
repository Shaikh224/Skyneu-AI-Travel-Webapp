import React, { useState, useEffect } from 'react';
import { Mail, X, Lock, User, Eye, EyeOff, Loader, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AppwriteAuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, type: initialType }) => {
  const [currentType, setCurrentType] = useState(initialType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginSuggestion, setShowLoginSuggestion] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  // Reset form when modal type changes
  useEffect(() => {
    setCurrentType(initialType);
    setError('');
    setSuccess('');
    setShowLoginSuggestion(false);
  }, [initialType]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setSuccess('');
    setShowLoginSuggestion(false);
    setAcceptTerms(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const switchToLogin = () => {
    setCurrentType('login');
    setError('');
    setShowLoginSuggestion(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setSuccess('');
      setIsLoading(true);
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (currentType === 'login') {
        await login(email, password);
        setSuccess('Welcome back!');
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        
        if (!acceptTerms) {
          setError('You must accept the Terms & Conditions to create an account');
          setIsLoading(false);
          return;
        }
        
        // Create account first
        await signup(email, password, name);
        
        // Show success message and redirect to profile page
        setSuccess('Account created successfully! 🎉 Redirecting to profile setup...');
        setTimeout(() => {
          handleClose();
          // Navigate to profile page for preference setup
          window.location.href = '/profile';
        }, 2000);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific error types with user-friendly messages
      let errorMessage = 'Authentication failed. Please try again.';
      let shouldShowLoginSuggestion = false;
      
      if (error.code === 409 || error.message?.includes('already exists')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
        shouldShowLoginSuggestion = true;
      } else if (error.code === 400 && error.message?.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 400 && error.message?.includes('password')) {
        errorMessage = 'Password must be at least 8 characters long.';
      } else if (error.code === 401 || error.message?.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowLoginSuggestion(shouldShowLoginSuggestion);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAuthStep = () => (
    <form onSubmit={handleAuthSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-sm font-medium mb-4">
          <Zap className="h-4 w-4" />
          {currentType === 'login' ? 'Welcome Back' : 'Join SkyNeu'}
        </div>
        <h2 className="text-2xl font-bold text-skyneu-dark dark:text-dark-text mb-2">
          {currentType === 'login' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-skyneu-text dark:text-dark-text-secondary">
          {currentType === 'login' 
            ? 'Welcome back! Sign in to continue your journey.' 
            : 'Create your account to start planning amazing trips with AI-powered recommendations.'
          }
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200 text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Login Suggestion */}
      {showLoginSuggestion && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Already have an account?{' '}
            <button
              type="button"
              onClick={switchToLogin}
              className="font-semibold hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      )}

      {/* Name Field (Signup only) */}
      {currentType === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-skyneu-dark dark:text-dark-text mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text"
            placeholder="Enter your full name"
            required
          />
        </div>
      )}


      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-skyneu-dark dark:text-dark-text mb-2">
          <Mail className="inline h-4 w-4 mr-1" />
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text"
          placeholder="Enter your email"
          required
        />
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-sm font-medium text-skyneu-dark dark:text-dark-text mb-2">
          <Lock className="inline h-4 w-4 mr-1" />
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-skyneu-blue bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text"
            placeholder="Enter your password"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-dark dark:hover:text-dark-text"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {currentType === 'signup' && (
          <p className="text-xs text-skyneu-text dark:text-dark-text-secondary mt-1">
            Password must be at least 8 characters long
          </p>
        )}
      </div>

      {/* Terms & Conditions Checkbox (Signup only) */}
      {currentType === 'signup' && (
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 text-skyneu-blue bg-white border-gray-300 rounded focus:ring-skyneu-blue focus:ring-2"
            />
          </div>
          <label htmlFor="acceptTerms" className="text-sm text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
            I agree to the{' '}
            <a 
              href="/terms-of-use" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-skyneu-blue hover:text-skyneu-green underline"
            >
              Terms of Use
            </a>
            {' '}and{' '}
            <a 
              href="/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-skyneu-blue hover:text-skyneu-green underline"
            >
              Privacy Policy
            </a>
          </label>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || (currentType === 'signup' && !acceptTerms)}
        className="w-full bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            {currentType === 'login' ? 'Signing In...' : 'Creating Account...'}
          </div>
        ) : (
          currentType === 'login' ? 'Sign In' : 'Create Account'
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-dark-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-dark-surface text-skyneu-text dark:text-dark-text-secondary">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-all duration-300 disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-skyneu-dark dark:text-dark-text font-medium">
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </span>
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setCurrentType(currentType === 'login' ? 'signup' : 'login');
            setError('');
            setSuccess('');
          }}
          className="text-skyneu-blue hover:text-skyneu-blue/80 text-sm font-medium"
        >
          {currentType === 'login' 
            ? "Don't have an account? Sign Up" 
            : 'Already have an account? Sign In'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-dark-border">
        <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-100 dark:border-dark-border p-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <img 
              src="/img/sknrm.png" 
              alt="SkyNeu Logo" 
              className="h-8 w-auto object-contain"
            />
            <span className="font-semibold text-skyneu-dark dark:text-dark-text">
              Authentication
            </span>
          </div>
          <button 
            onClick={handleClose}
            className="text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-dark dark:hover:text-dark-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {renderAuthStep()}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;