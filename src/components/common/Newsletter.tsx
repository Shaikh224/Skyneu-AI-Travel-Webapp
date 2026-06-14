import React, { useState } from 'react';
import { Mail, Bell, Users, Calendar, Sparkles, CheckCircle, ArrowRight, Globe, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { useNavigate } from 'react-router-dom';

const Newsletter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If user is not logged in, redirect to sign-in page
    if (!user) {
      navigate('/profile');
      return;
    }
    
    // If user is logged in, show success message
    setIsSubmitted(true);
    setEmail('');
  };

  const benefits = [
    { icon: <Zap className="h-5 w-5" />, text: "Instant access to AI features" },
    { icon: <Bell className="h-5 w-5" />, text: "Personalized travel deals" },
    { icon: <Globe className="h-5 w-5" />, text: "Real-time travel insights" },
    { icon: <Sparkles className="h-5 w-5" />, text: "Smart recommendations" }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-skyneu-blue via-skyneu-blue/95 to-skyneu-green relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 dark:bg-white/3 rounded-full blur-2xl"></div>
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-8 border border-white/30 dark:border-white/20">
              <Sparkles className="h-4 w-4" />
              <span>START YOUR JOURNEY TODAY</span>
            </div>
            <h2 className="font-bold text-4xl lg:text-6xl text-white mb-8 leading-tight">
              Join the
              <span className="block text-transparent bg-gradient-to-r from-white to-skyneu-light bg-clip-text">Travel Revolution</span>
            </h2>
            <p className="text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
              Sign up now and start your journey with AI-powered travel planning that adapts to your needs and preferences.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-white/10 text-center group hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-white/20 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-white">
                    {benefit.icon}
                  </div>
                </div>
                <p className="text-white/90 font-medium">{benefit.text}</p>
              </div>
            ))}
          </div>

          {/* Newsletter Form */}
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20 dark:border-white/10">
            {!user ? (
              <div className="text-center">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
                  <p className="text-white/90 text-lg mb-8">
                    Sign up or log in to access all our AI-powered travel features and start planning your perfect trip.
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="bg-white dark:bg-dark-surface text-skyneu-blue dark:text-skyneu-blue px-8 py-4 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group border border-white/20 dark:border-dark-border mx-auto"
                  >
                    <span>Sign Up / Log In</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ) : !isSubmitted ? (
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-skyneu-text h-5 w-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/50 bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text placeholder-skyneu-text dark:placeholder-dark-text-secondary font-medium border border-white/20 dark:border-dark-border"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-white dark:bg-dark-surface text-skyneu-blue dark:text-skyneu-blue px-8 py-4 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group border border-white/20 dark:border-dark-border"
                  >
                    <span>Subscribe to Updates</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <p className="text-white/70 text-sm mt-4 text-center">
                  No spam, unsubscribe at any time. We respect your privacy.
                </p>
              </form>
            ) : (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Welcome to SkyNeu!</h3>
                <p className="text-white/90 text-lg">
                  Thanks for subscribing! You'll receive the latest travel insights and updates.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Newsletter;