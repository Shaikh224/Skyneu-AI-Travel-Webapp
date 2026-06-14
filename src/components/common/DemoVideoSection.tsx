import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react';

const DemoVideoSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Ensure video plays when component mounts
    const video = videoRef.current;
    if (video) {
      // Set initial state
      video.muted = true;
      
      const attemptPlay = async () => {
        try {
          await video.play();
          setIsPlaying(true);
        } catch (err) {
          console.log('Auto-play prevented:', err);
          setIsPlaying(false);
        }
      };

      // Try to play after a short delay to ensure video is loaded
      const timer = setTimeout(attemptPlay, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-skyneu-green/5 dark:bg-skyneu-green/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 rounded-full mb-6">
            <Play className="h-4 w-4 sm:h-5 sm:w-5 text-skyneu-blue dark:text-skyneu-green" />
            <span className="text-xs sm:text-sm font-semibold text-skyneu-blue dark:text-skyneu-green">SEE IT IN ACTION</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-skyneu-dark dark:text-dark-text mb-4">
            Experience the Future of Travel
          </h2>
          <p className="text-lg sm:text-xl text-skyneu-text dark:text-dark-text-secondary max-w-3xl mx-auto">
            Watch how SkyNeu transforms the way you plan, book, and experience your journeys with AI-powered insights
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-6xl mx-auto">
          <div className="relative group">
            {/* Video wrapper with gradient border effect */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-skyneu-blue via-skyneu-green to-skyneu-blue p-1">
              <div className="relative rounded-2xl sm:rounded-[22px] overflow-hidden bg-black">
                {/* Video element */}
                <video
                  ref={videoRef}
                  className="w-full h-auto aspect-video object-cover"
                  loop
                  muted
                  autoPlay
                  playsInline
                  preload="auto"
                  poster="/img/poster.png"
                >
                  <source src="/img/demo-video.mp4" type="video/mp4" />
                  <source src="/img/demo-video.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>

                {/* Video controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Bottom controls bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center justify-between gap-4">
                      {/* Play/Pause button */}
                      <button
                        onClick={togglePlay}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 group/btn"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5 text-white" />
                        ) : (
                          <Play className="h-5 w-5 text-white ml-0.5" />
                        )}
                      </button>

                      <div className="flex items-center gap-3">
                        {/* Mute button */}
                        <button
                          onClick={toggleMute}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300"
                          aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? (
                            <VolumeX className="h-4 w-4 text-white" />
                          ) : (
                            <Volume2 className="h-4 w-4 text-white" />
                          )}
                        </button>

                        {/* Fullscreen button */}
                        <button
                          onClick={toggleFullscreen}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300"
                          aria-label="Fullscreen"
                        >
                          <Maximize2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center play button overlay (when paused) */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <button
                      onClick={togglePlay}
                      className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-skyneu-blue to-skyneu-green hover:scale-110 transition-transform duration-300 shadow-2xl"
                      aria-label="Play video"
                    >
                      <Play className="h-10 w-10 sm:h-12 sm:w-12 text-white ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Decorative glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-skyneu-blue/20 via-skyneu-green/20 to-skyneu-blue/20 rounded-3xl blur-2xl opacity-50 -z-10 group-hover:opacity-70 transition-opacity duration-500"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoVideoSection;
