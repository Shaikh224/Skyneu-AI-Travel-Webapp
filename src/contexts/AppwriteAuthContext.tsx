import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService, userPreferencesService, AuthUser, UserPreferences } from '@/lib/appwrite';

interface AuthContextType {
  user: AuthUser | null;
  userPreferences: UserPreferences | null;
  isAuthenticated: boolean;
  loading: boolean;
  isNewUser: boolean;
  needsOnboarding: boolean;
  subscriptionStatus: {
    subscription: 'free' | 'premium';
    isActive: boolean;
    expiresAt?: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  refreshUserPreferences: () => Promise<void>;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscription: 'free' | 'premium';
    isActive: boolean;
    expiresAt?: string;
  } | null>(null);

  const isAuthenticated = !!user;

  // Check if user is logged in on app load
  useEffect(() => {
    checkAuthStatus();
    
    // Check for OAuth callback on page load
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isOAuthSuccess = window.location.pathname === '/auth/success';
      
      if (isOAuthSuccess) {
        try {
          setLoading(true);
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
            
            // Check if user preferences exist
            const existingPreferences = await userPreferencesService.getUserPreferences(currentUser.$id);
            
            if (existingPreferences) {
              setUserPreferences(existingPreferences);
            } else {
              // Create default user preferences for OAuth users
              const defaultPreferences: Omit<UserPreferences, 'createdAt' | 'updatedAt'> = {
                userId: currentUser.$id,
                email: currentUser.email,
                name: currentUser.name,
                preferredDestinations: JSON.stringify([]),
                frequentAirlines: JSON.stringify([]),
                homeAirport: '',
                travelClass: 'economy',
                newsAlerts: true,
                flightAlerts: true,
                weatherAlerts: true,
                priceAlerts: true,
                defaultCurrency: 'USD',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: 'en',
                travelPurpose: 'both',
                interests: JSON.stringify([])
              } as any;
              
              const preferences = await userPreferencesService.createUserPreferences(defaultPreferences);
              setUserPreferences(preferences);
              setIsNewUser(true);
              setNeedsOnboarding(true);
            }
            
            // Show success toast
            toast.success('Welcome! Successfully signed in with Google.', {
              duration: 3000,
              style: {
                background: '#3B82F6',
                color: '#fff',
              },
            });
          }
        } catch (error: any) {
          console.error('OAuth callback failed:', error);
          toast.error('Authentication failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        await loadUserPreferences(currentUser.$id);
      }
    } catch (error: any) {
      // Suppress expected authentication errors for guests
      if (error.code === 401 || error.message?.includes('missing scopes') || error.message?.includes('Unauthorized')) {
        // User is not authenticated, which is expected for guests
        // Don't log this as it's expected behavior
      } else {
        console.error('Auth check failed:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      const preferences = await userPreferencesService.getUserPreferences(userId);
      if (preferences) {
        setUserPreferences(preferences);
      }
      
      // Get current user to check labels for subscription status
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Check subscription from user labels
        const userLabels = currentUser.labels || [];
        const hasPremium = userLabels.includes('premium');
        
        setSubscriptionStatus({
          subscription: hasPremium ? 'premium' : 'free',
          isActive: hasPremium,
          expiresAt: undefined // Labels don't have expiration, handle separately if needed
        });
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await authService.login(email, password);
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        await loadUserPreferences(currentUser.$id);
        
        // Show success toast
        toast.success('Welcome back! 👋', {
          duration: 3000,
          style: {
            background: '#3B82F6',
            color: '#fff',
          },
        });
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Enhance error message for better user experience
      if (error.code === 401 || error.message?.includes('Invalid credentials')) {
        throw new Error('Invalid email or password. Please check your credentials.');
      } else if (error.code === 400 && error.message?.includes('invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else {
        throw error; // Re-throw original error for other cases
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      await authService.createAccount(email, password, name);
      
      // Login after successful signup
      await authService.login(email, password);
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsNewUser(true);
        setNeedsOnboarding(true);
        
        // Create default user preferences
        const defaultPreferences: Omit<UserPreferences, 'createdAt' | 'updatedAt'> = {
          userId: currentUser.$id,
          email: currentUser.email,
          name: currentUser.name,
          preferredDestinations: JSON.stringify([]),
          frequentAirlines: JSON.stringify([]),
          homeAirport: '',
          travelClass: 'economy',
          newsAlerts: true,
          flightAlerts: true,
          weatherAlerts: true,
          priceAlerts: true,
          defaultCurrency: 'USD',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: 'en',
          travelPurpose: 'both',
          interests: JSON.stringify([])
        } as any;
        
        const preferences = await userPreferencesService.createUserPreferences(defaultPreferences);
        setUserPreferences(preferences);
        
        // Show success toast
        toast.success('Account created successfully! 🎉 Please complete your profile setup.', {
          duration: 5000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      
      // Enhance error message for better user experience
      if (error.code === 409 || error.message?.includes('already exists')) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      } else if (error.code === 400 && error.message?.includes('invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 400 && error.message?.includes('password')) {
        throw new Error('Password must be at least 8 characters long.');
      } else {
        throw error; // Re-throw original error for other cases
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await authService.loginWithGoogle();
      // Note: The actual login will happen after the OAuth redirect
      // This function just initiates the OAuth flow
    } catch (error: any) {
      console.error('Google OAuth login failed:', error);
      setLoading(false);
      throw new Error('Google login failed. Please try again.');
    }
  };

  // Handle OAuth callback - this should be called after OAuth redirect
  const handleOAuthCallback = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        // Check if user preferences exist
        const existingPreferences = await userPreferencesService.getUserPreferences(currentUser.$id);
        
        if (existingPreferences) {
          setUserPreferences(existingPreferences);
        } else {
          // Create default user preferences for OAuth users
          const defaultPreferences: Omit<UserPreferences, 'createdAt' | 'updatedAt'> = {
            userId: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
            preferredDestinations: JSON.stringify([]),
            frequentAirlines: JSON.stringify([]),
            homeAirport: '',
            travelClass: 'economy',
            newsAlerts: true,
            flightAlerts: true,
            weatherAlerts: true,
            priceAlerts: true,
            defaultCurrency: 'USD',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: 'en',
            travelPurpose: 'both',
            interests: JSON.stringify([])
          } as any;
          
          const preferences = await userPreferencesService.createUserPreferences(defaultPreferences);
          setUserPreferences(preferences);
          setIsNewUser(true);
          setNeedsOnboarding(true);
        }
        
        // Show success toast
        toast.success('Welcome! Successfully signed in with Google.', {
          duration: 3000,
          style: {
            background: '#3B82F6',
            color: '#fff',
          },
        });
      }
    } catch (error: any) {
      console.error('OAuth callback failed:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setUserPreferences(null);
      setIsNewUser(false);
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const completeOnboarding = () => {
    setIsNewUser(false);
    setNeedsOnboarding(false);
  };

  const updateUserPreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      let updatedPreferences: UserPreferences;
      
      if (!userPreferences || !userPreferences.$id) {
        // Create new preferences if none exist with default values
        const newPreferences = {
          userId: user.$id,
          email: user.email || '',
          name: user.name || '',
          preferredDestinations: [],
          frequentAirlines: [],
          travelClass: 'economy',
          travelPurpose: 'leisure',
          defaultCurrency: 'USD',
          interests: [],
          newsAlerts: true,
          flightAlerts: true,
          weatherAlerts: true,
          priceAlerts: true,
          language: 'en',
          ...updates
        };
        updatedPreferences = await userPreferencesService.createUserPreferences(newPreferences);
      } else {
        // Update existing preferences
        updatedPreferences = await userPreferencesService.updateUserPreferences(
          userPreferences.$id,
          updates
        );
      }
      
      setUserPreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  };

  const refreshUserPreferences = async () => {
    if (!user) return;
    
    try {
      await loadUserPreferences(user.$id);
    } catch (error) {
      console.error('Failed to refresh user preferences:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userPreferences,
    isAuthenticated,
    loading,
    isNewUser,
    needsOnboarding,
    subscriptionStatus,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateUserPreferences,
    refreshUserPreferences,
    completeOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Safe version for components that might render during hot reload
export const useAuthSafe = (): AuthContextType | null => {
  const context = useContext(AuthContext);
  return context || null;
};
