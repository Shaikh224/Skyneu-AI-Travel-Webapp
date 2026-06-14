import React, { useState } from 'react';
import { Lock, Crown, Star, Zap, Shield, Sparkles, Loader2, MapPin, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { subscriptionService } from '@/services/subscriptionService';
import toast from 'react-hot-toast';

interface PremiumLockProps {
  feature: string;
}

const PremiumLock: React.FC<PremiumLockProps> = ({ feature }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const features = [
    { 
      icon: Zap, 
      title: 'Unlimited Searches',
      text: 'Search unlimited flights without restrictions'
    },
    { 
      icon: MapPin, 
      title: 'Trip Planner',
      text: 'Plan your perfect journey with AI assistance'
    },
    { 
      icon: Bell, 
      title: 'Smart Updates',
      text: 'Get real-time notifications about your trips'
    },
    { 
      icon: Shield, 
      title: 'Priority Support',
      text: '24/7 dedicated support and instant responses'
    },
    { 
      icon: Sparkles, 
      title: 'AI Assistant',
      text: 'Smart recommendations powered by AI'
    },
    { 
      icon: Crown, 
      title: 'Exclusive Access',
      text: 'Early access to new features and updates'
    }
  ];

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(true);

    try {
      const { url } = await subscriptionService.createCheckoutSession(
        user.$id,
        user.email,
        user.name
      );

      // Redirect to Dodo hosted checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to create checkout session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg p-4 sm:p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-skyneu-blue rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-skyneu-green rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left Side - Visual with Background Image */}
            <div className="relative overflow-hidden min-h-[300px] lg:min-h-[450px]">
              {/* Background Image Overlay */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=1200&fit=crop')"
                }}
              ></div>
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-skyneu-blue/95 via-skyneu-blue/90 to-skyneu-green/95"></div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                    <Crown className="h-4 w-4 text-yellow-300" />
                    <span className="text-xs sm:text-sm font-semibold text-white">Premium Feature</span>
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                    Unlock Premium Access
                  </h1>
                  <p className="text-lg sm:text-xl text-white/90 font-medium mb-2">
                    {feature}
                  </p>
                  <p className="text-white/80 text-sm sm:text-base mb-6">
                    Join thousands of travelers enjoying unlimited access to all premium features.
                  </p>
                </div>

                {/* Floating Info Cards */}
                <div className="space-y-2">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 transform hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                        <Lock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-xs sm:text-sm">Secure & Private</p>
                        <p className="text-white/80 text-xs">Your data is encrypted</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 transform hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-xs sm:text-sm">Cancel Anytime</p>
                        <p className="text-white/80 text-xs">No commitment required</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Features & CTA */}
            <div className="p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-dark-surface">
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 rounded-full mb-3 border border-skyneu-blue/20">
                    <Star className="h-3.5 w-3.5 text-skyneu-blue" />
                    <span className="text-xs font-semibold text-skyneu-blue">Premium Benefits</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-skyneu-dark dark:text-dark-text mb-2">
                    Everything You Need
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get access to all features with a single subscription
                  </p>
                </div>

                {/* Features Grid */}
                <div className="space-y-2.5 mb-6">
                  {features.map((feat, index) => (
                    <div 
                      key={index} 
                      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border border-transparent hover:border-skyneu-blue/10"
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-skyneu-blue to-skyneu-green rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                        <feat.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h3 className="font-semibold text-sm text-skyneu-dark dark:text-dark-text mb-0.5">
                          {feat.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {feat.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Section */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-skyneu-blue/5 to-skyneu-green/5 rounded-xl p-4 border border-skyneu-blue/20">
                  {/* Early Access Offer Badge */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold mb-2">
                    🔥 Early Access Offer
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-400 line-through">$5</span>
                      <span className="text-3xl font-bold text-skyneu-dark dark:text-dark-text">$2.99</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">/month</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
                      40% OFF
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Limited time</span>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Billed monthly • Cancel anytime • No hidden fees
                  </p>
                  
                  <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        Get Early Access - $2.99/mo
                        <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  ✓ Instant activation • ✓ Secure checkout • ✓ 100% guaranteed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Trusted by travelers worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Data Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">Rated 4.9/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLock;
