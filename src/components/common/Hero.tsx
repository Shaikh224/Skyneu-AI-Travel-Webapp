import React, { useState } from 'react';
import { Search, Sparkles, Plane, Calendar, MapPin, ArrowRight, Briefcase, Compass, Users, Brain, Zap, Hotel, Utensils } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import AuthModal from '../auth/AppwriteAuthModal';
import { useNavigate } from 'react-router-dom';

const AnimatedEarthGlobe: React.FC = () => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const destinations = [
    { id: 'paris', top: '28%', left: '48%', name: 'Paris', deal: '$599', region: 'europe' },
    { id: 'tokyo', top: '32%', left: '75%', name: 'Tokyo', deal: '$899', region: 'asia' },
    { id: 'nyc', top: '30%', left: '22%', name: 'New York', deal: '$449', region: 'america' },
    { id: 'dubai', top: '42%', left: '58%', name: 'Dubai', deal: '$699', region: 'middle-east' },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Globe Container */}
      <div className="relative w-80 h-80 lg:w-[420px] lg:h-[420px]">
        {/* Globe Base with 3D Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 shadow-2xl transform-gpu">
          {/* Earth Surface with Continents */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {/* Ocean Base */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800"></div>
            
            {/* Continent Shapes - Simplified Earth Landmasses */}
            <div className="absolute inset-0 rounded-full">
              {/* North America */}
              <div className="absolute top-[20%] left-[15%] w-16 h-20 bg-green-600 dark:bg-green-700 rounded-tl-3xl rounded-br-2xl transform rotate-12 opacity-80"></div>
              
              {/* South America */}
              <div className="absolute top-[45%] left-[20%] w-8 h-16 bg-green-700 dark:bg-green-800 rounded-full transform rotate-12 opacity-80"></div>
              
              {/* Europe */}
              <div className="absolute top-[25%] left-[45%] w-6 h-8 bg-green-600 dark:bg-green-700 rounded-lg opacity-80"></div>
              
              {/* Africa */}
              <div className="absolute top-[35%] left-[48%] w-10 h-16 bg-green-700 dark:bg-green-800 rounded-t-2xl rounded-b-lg opacity-80"></div>
              
              {/* Asia */}
              <div className="absolute top-[20%] left-[60%] w-20 h-12 bg-green-600 dark:bg-green-700 rounded-2xl transform -rotate-6 opacity-80"></div>
              
              {/* Australia */}
              <div className="absolute top-[60%] left-[70%] w-8 h-6 bg-green-700 dark:bg-green-800 rounded-xl opacity-80"></div>
              
              {/* Additional landmass details */}
              <div className="absolute top-[30%] left-[25%] w-4 h-6 bg-green-800 dark:bg-green-900 rounded-lg opacity-60"></div>
              <div className="absolute top-[50%] left-[65%] w-6 h-4 bg-green-800 dark:bg-green-900 rounded-lg opacity-60"></div>
            </div>
            
            {/* Cloud Layer */}
            <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '60s' }}>
              <div className="absolute top-[15%] left-[30%] w-12 h-6 bg-white/20 rounded-full blur-sm"></div>
              <div className="absolute top-[40%] left-[60%] w-16 h-8 bg-white/15 rounded-full blur-sm"></div>
              <div className="absolute top-[65%] left-[20%] w-10 h-5 bg-white/20 rounded-full blur-sm"></div>
              <div className="absolute top-[25%] left-[75%] w-8 h-4 bg-white/15 rounded-full blur-sm"></div>
            </div>
            
            {/* Atmosphere Glow */}
            <div className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-blue-400/30 via-cyan-300/20 to-blue-400/30 blur-md"></div>
            
            {/* Day/Night Terminator */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-transparent to-black/40"></div>
            
            {/* Highlight/Shine Effect */}
            <div className="absolute top-[20%] left-[20%] w-24 h-24 bg-gradient-to-br from-white/30 via-white/10 to-transparent rounded-full blur-xl"></div>
          </div>
          
          {/* Rotating Grid Lines */}
          <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '30s' }}>
            {/* Latitude Lines */}
            <div className="absolute top-[25%] left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute top-[50%] left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="absolute top-[75%] left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            {/* Longitude Lines */}
            <div className="absolute top-0 left-[25%] w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
            <div className="absolute top-0 left-[50%] w-px h-full bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
            <div className="absolute top-0 left-[75%] w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
          </div>
        </div>

        {/* Orbiting Satellites */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
          <div className="absolute -top-4 left-1/2 w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2 shadow-lg animate-pulse"></div>
          <div className="absolute top-1/2 -right-4 w-2 h-2 bg-red-400 rounded-full transform -translate-y-1/2 shadow-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-4 left-1/2 w-3 h-3 bg-green-400 rounded-full transform -translate-x-1/2 shadow-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 -left-4 w-2 h-2 bg-blue-400 rounded-full transform -translate-y-1/2 shadow-lg animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Animated Flight Paths - More Dynamic */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="flightPath1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(17, 141, 255, 0)" />
                <stop offset="50%" stopColor="rgba(17, 141, 255, 0.9)" />
                <stop offset="100%" stopColor="rgba(17, 141, 255, 0)" />
              </linearGradient>
              <linearGradient id="flightPath2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(24, 203, 150, 0)" />
                <stop offset="50%" stopColor="rgba(24, 203, 150, 0.9)" />
                <stop offset="100%" stopColor="rgba(24, 203, 150, 0)" />
              </linearGradient>
              <linearGradient id="flightPath3" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(234, 179, 8, 0)" />
                <stop offset="50%" stopColor="rgba(234, 179, 8, 0.8)" />
                <stop offset="100%" stopColor="rgba(234, 179, 8, 0)" />
              </linearGradient>
            </defs>
            
            {/* Multiple crossing paths */}
            <path
              d="M 15 25 Q 50 5 85 35"
              stroke="url(#flightPath1)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="5,3"
              className="animate-pulse"
            />
            <path
              d="M 20 75 Q 50 95 80 65"
              stroke="url(#flightPath2)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="5,3"
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
            <path
              d="M 10 50 Q 50 30 90 50"
              stroke="url(#flightPath3)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4,2"
              className="animate-pulse"
              style={{ animationDelay: '2s' }}
            />
            
            {/* Animated dots along paths */}
            <circle r="2" fill="#118DFF" className="animate-ping" style={{ animationDuration: '3s' }}>
              <animateMotion dur="8s" repeatCount="indefinite" path="M 15 25 Q 50 5 85 35" />
            </circle>
            <circle r="2" fill="#18CB96" className="animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}>
              <animateMotion dur="10s" repeatCount="indefinite" path="M 20 75 Q 50 95 80 65" />
            </circle>
            <circle r="1.5" fill="#EAB308" className="animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }}>
              <animateMotion dur="12s" repeatCount="indefinite" path="M 10 50 Q 50 30 90 50" />
            </circle>
          </svg>
        </div>

        {/* Floating Airplanes with Journey Timeline */}
        <div className="absolute inset-0">
          {/* Airplane 1 - Following path with trail */}
          <div className="absolute top-1/4 left-1/4 animate-spin" style={{ animationDuration: '15s' }}>
            <div className="relative">
              {/* Plane trail */}
              <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent to-skyneu-blue/50 blur-sm"></div>
              <div className="w-9 h-9 bg-white/95 dark:bg-white/85 rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-skyneu-blue/30 hover:scale-110 transition-transform">
                <Plane className="h-5 w-5 text-skyneu-blue transform rotate-45" />
              </div>
            </div>
          </div>
          
          {/* Airplane 2 - Different orbit */}
          <div className="absolute top-3/4 right-1/4 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }}>
            <div className="relative">
              <div className="absolute -right-8 top-1/2 w-8 h-0.5 bg-gradient-to-l from-transparent to-skyneu-green/50 blur-sm"></div>
              <div className="w-9 h-9 bg-white/95 dark:bg-white/85 rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-skyneu-green/30 hover:scale-110 transition-transform">
                <Plane className="h-5 w-5 text-skyneu-green transform -rotate-12" />
              </div>
            </div>
          </div>
          
          {/* Destination Highlights with Interactive Cards */}
          {destinations.map((dest, index) => (
            <div
              key={dest.id}
              className="absolute group cursor-pointer"
              style={{ top: dest.top, left: dest.left }}
              onMouseEnter={() => setHoveredRegion(dest.region)}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              {/* Pulsing marker */}
              <div className="relative animate-float" style={{ animationDelay: `${index * 0.5}s` }}>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full relative flex items-center justify-center">
                  <MapPin className="h-2 w-2 text-white" />
                </div>
              </div>
              
              {/* Popup card on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md rounded-xl shadow-2xl p-3 border border-white/60 dark:border-dark-border min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-3 w-3 text-skyneu-blue" />
                    <span className="text-xs font-bold text-skyneu-dark dark:text-dark-text">{dest.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-skyneu-text dark:text-dark-text-secondary">From</span>
                    <span className="text-sm font-bold text-skyneu-green">{dest.deal}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-skyneu-blue">
                    <Sparkles className="h-2 w-2" />
                    <span>AI Recommended</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* AI Intelligence Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {/* AI Node 1 - Connecting lines */}
          <div className="absolute top-[30%] left-[25%] animate-float">
            <div className="relative">
              <div className="absolute inset-0 bg-skyneu-blue/20 rounded-full blur-md w-6 h-6 animate-pulse"></div>
              <div className="w-4 h-4 bg-skyneu-blue rounded-full flex items-center justify-center shadow-lg relative">
                <Zap className="h-2 w-2 text-white" />
              </div>
              {/* Connection lines */}
              <svg className="absolute top-0 left-0 w-20 h-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <line x1="10" y1="10" x2="30" y2="30" stroke="rgba(17, 141, 255, 0.3)" strokeWidth="1" strokeDasharray="2,2" />
              </svg>
            </div>
          </div>
          
          <div className="absolute top-[60%] right-[30%] animate-float" style={{ animationDelay: '1.5s' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-skyneu-green/20 rounded-full blur-md w-6 h-6 animate-pulse"></div>
              <div className="w-4 h-4 bg-skyneu-green rounded-full flex items-center justify-center shadow-lg">
                <Brain className="h-2 w-2 text-white" />
              </div>
            </div>
          </div>
          
          <div className="absolute top-[45%] left-[55%] animate-float" style={{ animationDelay: '0.8s' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md w-6 h-6 animate-pulse"></div>
              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traveler Personas & Journey Timeline */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Business Traveler */}
        <div className="absolute top-[10%] left-[-15%] animate-float">
          <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-white/60 dark:border-dark-border hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-skyneu-dark dark:text-dark-text">Business</span>
                </div>
                <span className="text-[10px] text-skyneu-text dark:text-dark-text-secondary">34 flights tracked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Adventure Traveler */}
        <div className="absolute top-[15%] right-[-18%] animate-float" style={{ animationDelay: '2s' }}>
          <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-white/60 dark:border-dark-border hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-skyneu-blue rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-skyneu-dark dark:text-dark-text">Adventure</span>
                </div>
                <span className="text-[10px] text-skyneu-text dark:text-dark-text-secondary">AI suggestions ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Family Traveler */}
        <div className="absolute bottom-[15%] left-[-12%] animate-float" style={{ animationDelay: '4s' }}>
          <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-white/60 dark:border-dark-border hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-skyneu-green rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-skyneu-dark dark:text-dark-text">Family</span>
                </div>
                <span className="text-[10px] text-skyneu-text dark:text-dark-text-secondary">Group booking active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Timeline Card */}
        <div className="absolute bottom-[10%] right-[-20%] animate-float" style={{ animationDelay: '1s' }}>
          <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-white/60 dark:border-dark-border hover:scale-105 transition-transform">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-skyneu-dark dark:text-dark-text">Your Journey</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Plane className="h-3 w-3 text-skyneu-blue" />
                <div className="w-4 h-px bg-skyneu-blue/50"></div>
                <Hotel className="h-3 w-3 text-skyneu-green" />
                <div className="w-4 h-px bg-skyneu-green/50"></div>
                <Utensils className="h-3 w-3 text-orange-500" />
              </div>
            </div>
            <span className="text-[10px] text-skyneu-text dark:text-dark-text-secondary mt-1 block">Planned by AI</span>
          </div>
        </div>
      </div>

      {/* Orbital Rings */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-[-20px] border border-skyneu-blue/20 dark:border-skyneu-blue/30 rounded-full animate-spin" style={{ animationDuration: '40s' }}></div>
        <div className="absolute inset-[-40px] border border-skyneu-green/15 dark:border-skyneu-green/25 rounded-full animate-spin" style={{ animationDuration: '50s', animationDirection: 'reverse' }}></div>
      </div>

      {/* Background Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-[30%] left-[80%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[70%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[80%] left-[85%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-[15%] left-[60%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-[60%] left-[40%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
};

const Hero: React.FC = () => {
  const [authModal, setAuthModal] = React.useState<{ isOpen: boolean; type: 'login' | 'signup' } | null>(null);
  const { isAuthenticated } = useAuth();
  useTheme();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/onboarding');
    } else {
      setAuthModal({ isOpen: true, type: 'signup' });
    }
  };

  const handleSearchFlights = () => {
    navigate('/flight-search');
  };

  return (
    <>
      <section className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg relative overflow-hidden">
        {/* Grid Lines Background */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Animated Grid Lines */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <div className="absolute inset-0 animate-pulse" style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            animationDuration: '4s'
          }}></div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-skyneu-green/5 dark:bg-skyneu-green/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 min-h-[85vh]">
            <div className="flex-1 text-center lg:text-left z-10 max-w-3xl lg:pr-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border border-skyneu-blue/20 dark:border-skyneu-blue/30 text-skyneu-blue dark:text-skyneu-blue rounded-full text-sm font-semibold mb-6 shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span>AI-Powered Travel Platform</span>
                <div className="w-2 h-2 bg-skyneu-green rounded-full animate-pulse"></div>
              </div>
              
              {/* Main Heading */}
              <h1 className="font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-skyneu-dark dark:text-dark-text leading-[1.1] mb-6">
                Your AI Travel Copilot
                <span className="block mt-2 text-transparent bg-gradient-to-r from-skyneu-blue to-skyneu-green bg-clip-text">
                  Smarter Trips, Seamless Journeys
                </span>
              </h1>
              
              {/* Subheading */}
              <p className="text-lg sm:text-xl lg:text-2xl text-skyneu-text dark:text-dark-text-secondary mb-8 leading-relaxed max-w-2xl">
                Plan smarter trips, track flights in real-time, and explore destinations worldwide — all with your AI travel copilot
              </p>
              
              {/* CTA Buttons with Micro Animations */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={handleGetStarted}
                  className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-skyneu-blue to-skyneu-blue/90 text-white font-semibold rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  {/* Animated plane on hover */}
                  <div className="absolute -left-10 top-1/2 -translate-y-1/2 group-hover:left-[calc(100%+10px)] transition-all duration-[2000ms] ease-in-out">
                    <Plane className="h-4 w-4 text-white/70 transform rotate-45" />
                  </div>
                  
                  <span className="relative z-10">{isAuthenticated ? 'Continue' : 'Start Your Journey'}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
                <button 
                  onClick={handleSearchFlights}
                  className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-dark-surface border-2 border-gray-200 dark:border-dark-border text-skyneu-dark dark:text-dark-text font-semibold rounded-2xl hover:border-skyneu-blue dark:hover:border-skyneu-blue hover:text-skyneu-blue dark:hover:text-skyneu-blue hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <Search className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  <span>Explore Flights</span>
                  
                  {/* Pulse ring on hover */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-skyneu-blue opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"></div>
                </button>
              </div>

            </div>

            {/* 3D Earth Globe */}
            <div className="flex-1 relative z-10 lg:max-w-md lg:-ml-20">
              <AnimatedEarthGlobe />
            </div>
          </div>
        </div>
      </section>


      {authModal && (
        <AuthModal
          isOpen={authModal.isOpen}
          type={authModal.type}
          onClose={() => setAuthModal(null)}
        />
      )}
    </>
  );
};

export default Hero;