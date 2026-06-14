import React, { useState, useEffect, useRef } from 'react';

const LoadingScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingText, setLoadingText] = useState(0);
  const [progress, setProgress] = useState(0);
  const isMountedRef = useRef(true);

  const loadingMessages = [
    "Initializing your travel experience...",
    "Loading flight data...",
    "Preparing AI recommendations...",
    "Setting up your dashboard...",
    "Almost ready to take off..."
  ];

  useEffect(() => {
    isMountedRef.current = true;
    
    // Simulate user engagement based loading
    const textInterval = setInterval(() => {
      if (isMountedRef.current) {
        setLoadingText(prev => (prev + 1) % loadingMessages.length);
      }
    }, 800);

    const progressInterval = setInterval(() => {
      if (isMountedRef.current) {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            clearInterval(textInterval);
            // Hide loading screen after completion
            setTimeout(() => {
              if (isMountedRef.current) {
                setIsVisible(false);
              }
            }, 500);
            return 100;
          }
          return prev + Math.random() * 15; // Random progress increments for engagement
        });
      }
    }, 200);

    return () => {
      isMountedRef.current = false;
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [loadingMessages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-skyneu-blue/20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-skyneu-green/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-skyneu-blue/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Loading Container */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Plane Image Container */}
        <div className="relative w-48 h-48 mb-8">
          {/* Main Plane Image */}
          <img
            src="/img/skin2.png"
            alt="Skyneu Plane"
            width="192"
            height="192"
            fetchPriority="high"
            className="w-full h-full object-contain animate-pulse"
            style={{ animationDuration: '2s' }}
          />
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-skyneu-dark mb-4 animate-pulse">
            Skyneu
          </h2>
          <div className="flex items-center justify-center gap-2 text-skyneu-blue mb-6">
            <div className="w-2 h-2 bg-skyneu-blue rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-skyneu-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-skyneu-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
          {/* Dynamic Loading Message */}
          <div className="h-8 flex items-center justify-center">
            <p className="text-skyneu-text text-sm transition-all duration-500">
              {loadingMessages[loadingText]}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-80 h-2 bg-gray-200 rounded-full mt-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        {/* Progress Percentage */}
        <div className="mt-4 text-skyneu-text text-sm">
          {Math.round(Math.min(progress, 100))}%
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/6 w-1 h-1 bg-skyneu-blue rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/6 w-1 h-1 bg-skyneu-green rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-skyneu-blue rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-skyneu-green rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/8 w-1 h-1 bg-skyneu-blue rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-2/3 right-1/8 w-1 h-1 bg-skyneu-green rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
