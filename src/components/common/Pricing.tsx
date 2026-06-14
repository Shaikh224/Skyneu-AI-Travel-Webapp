import React from 'react';
import { Zap, Brain, Search, Plane, Users, Globe, Bell, Shield, TrendingUp, MapPin, Calendar, ArrowRight, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { useNavigate } from 'react-router-dom';

const Pricing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/onboarding');
    } else {
      navigate('/profile');
    }
  };

  const features = [
    { icon: <Brain className="h-5 w-5" />, text: "AI Travel Assistant" },
    { icon: <Search className="h-5 w-5" />, text: "Smart Search Engine" },
    { icon: <Plane className="h-5 w-5" />, text: "Flight Tracking & Alerts" },
    { icon: <Users className="h-5 w-5" />, text: "Group Planning Tools" },
    { icon: <Globe className="h-5 w-5" />, text: "Global Travel Hub" },
    { icon: <Bell className="h-5 w-5" />, text: "Smart Notifications" },
    { icon: <Shield className="h-5 w-5" />, text: "Enhanced Security" },
    { icon: <TrendingUp className="h-5 w-5" />, text: "Price Analytics" },
    { icon: <MapPin className="h-5 w-5" />, text: "Local Insights" },
    { icon: <Calendar className="h-5 w-5" />, text: "Smart Scheduling" },
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg transition-colors duration-300">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-sm font-semibold mb-8 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
            <Zap className="h-4 w-4" />
            <span>SMART PRICING</span>
          </div>
          <h2 className="font-bold text-4xl lg:text-6xl text-skyneu-dark dark:text-dark-text mb-8 leading-tight">
            One Plan,
            <span className="block text-transparent bg-gradient-to-r from-skyneu-blue to-skyneu-green bg-clip-text">
              All Features
            </span>
          </h2>
          <p className="text-xl text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
            Get access to all our AI-powered travel features for one simple monthly price.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white px-6 py-2 rounded-full text-sm font-bold shadow-2xl border-2 border-white dark:border-dark-bg">
                ⭐ Most Popular
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden relative">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-skyneu-blue via-skyneu-blue/90 to-skyneu-green p-6 lg:p-8 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 lg:w-64 lg:h-64 bg-white rounded-full -translate-y-16 lg:-translate-y-32 translate-x-16 lg:translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 lg:w-48 lg:h-48 bg-white rounded-full translate-y-12 lg:translate-y-24 -translate-x-12 lg:-translate-x-24"></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <h3 className="font-bold text-3xl lg:text-4xl mb-3">
                    SkyNeu Pro
                  </h3>
                  <p className="text-lg lg:text-xl opacity-90 mb-6 max-w-2xl mx-auto">
                    Complete AI-powered travel planning suite
                  </p>
                  
                  {/* Early Access Offer Badge */}
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold mb-4">
                    🔥 Early Access Offer
                  </div>
                  
                  {/* Price Display */}
                  <div className="flex items-baseline justify-center gap-3 mb-4">
                    <span className="text-3xl lg:text-4xl font-bold line-through opacity-60">
                      $5
                    </span>
                    <span className="text-5xl lg:text-6xl font-black">
                      $2.99
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xl lg:text-2xl font-semibold opacity-90">/month</span>
                      <span className="text-xs opacity-75">per user</span>
                    </div>
                  </div>
                  
                  {/* Discount Badge */}
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-400 text-green-900 text-xs font-bold">
                      Save 40% - Limited Time
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button 
                    onClick={handleGetStarted}
                    className="group bg-white text-skyneu-blue px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                  >
                    <span className="flex items-center gap-2">
                      {isAuthenticated ? 'Continue' : 'Get Started'}
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Features Section - Mobile Optimized */}
              <div className="p-6 lg:p-8">
                {/* Features Grid - Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  {/* Left Column - Features */}
                  <div>
                    <h4 className="font-bold text-xl lg:text-2xl text-skyneu-dark dark:text-dark-text mb-6">
                      Everything You Get
                    </h4>
                    <div className="space-y-4">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 group">
                          <div className="w-8 h-8 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                            <div className="text-skyneu-blue">
                              {feature.icon}
                            </div>
                          </div>
                          <span className="text-skyneu-dark dark:text-dark-text font-semibold">
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Value Props - Hidden on Mobile */}
                  <div className="hidden lg:block space-y-6">
                    <div>
                      <h4 className="font-bold text-xl text-skyneu-dark dark:text-dark-text mb-4">
                        Why Choose SkyNeu Pro?
                      </h4>
                      
                      {/* Value Cards */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-skyneu-blue/5 to-skyneu-green/5 rounded-xl p-4 border border-skyneu-blue/10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-skyneu-blue rounded-lg flex items-center justify-center">
                              <Zap className="h-3 w-3 text-white" />
                            </div>
                            <h5 className="font-bold text-skyneu-dark dark:text-dark-text text-sm">Time Savings</h5>
                          </div>
                          <p className="text-skyneu-text dark:text-dark-text-secondary text-sm">
                            Save 10+ hours per trip with AI automation
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-skyneu-green/5 to-skyneu-blue/5 rounded-xl p-4 border border-skyneu-green/10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-skyneu-green rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-3 w-3 text-white" />
                            </div>
                            <h5 className="font-bold text-skyneu-dark dark:text-dark-text text-sm">Cost Optimization</h5>
                          </div>
                          <p className="text-skyneu-text dark:text-dark-text-secondary text-sm">
                            Find better deals with smart analytics
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl p-4 border border-purple-500/10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                              <Shield className="h-3 w-3 text-white" />
                            </div>
                            <h5 className="font-bold text-skyneu-dark dark:text-dark-text text-sm">Peace of Mind</h5>
                          </div>
                          <p className="text-skyneu-text dark:text-dark-text-secondary text-sm">
                            Travel with confidence and monitoring
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Value Proposition - Mobile Optimized */}
                <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-gray-100 dark:border-dark-border">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 rounded-2xl border border-skyneu-blue/20 dark:border-skyneu-blue/30 max-w-2xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-xl flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-skyneu-dark dark:text-dark-text">
                          Less than the price of a coffee a day — just $2.99/month for unlimited AI travel planning.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
