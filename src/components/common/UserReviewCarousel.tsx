import React, { useState, useEffect, useRef } from 'react';
// Updated component - no Quote import needed
import { Star, User } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  role: string;
  company: string;
  rating: number;
  content: string;
  avatar?: string;
  verified?: boolean;
}

const reviews: Review[] = [
  {
    id: 1,
    name: "Early tester",
    role: "",
    company: "",
    rating: 5,
    content: "skyneu's AI travel planner has completely changed how I organize trips. It actually remembers my preferences and suggests itineraries that save me time and stress.",
    verified: true
  },
  {
    id: 2,
    name: "Early tester",
    role: "",
    company: "",
    rating: 5,
    content: "I've been testing SkyNeu for a few weeks, and it's already made my travel planning easier. The flight data and visa checking are a lifesaver.",
    verified: true
  },
  {
    id: 3,
    name: "Early tester",
    role: "",
    company: "",
    rating: 5,
    content: "As someone who tracks aviation trends professionally, I find SkyNeu's flight data accuracy and visualizations really helpful. The platform feels like a sneak peek into the future of travel tools.",
    verified: true
  },
  {
    id: 4,
    name: "Early tester",
    role: "",
    company: "",
    rating: 5,
    content: "Testing SkyNeu on my business trips has been great — the real-time updates and itinerary suggestions are genuinely useful. The interface is clean and intuitive.",
    verified: true
  },
  {
    id: 5,
    name: "Early tester",
    role: "",
    company: "",
    rating: 5,
    content: "I'm really enjoying SkyNeu's aviation learning features. As an aviation enthusiast, the interactive guides are informative and easy to follow — it makes learning fun.",
    verified: true
  }
];

const UserReviewCarousel: React.FC = () => {
  const [, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex === reviews.length - 1 ? 0 : prevIndex + 1;
        
        // Auto-scroll to next card
        if (scrollContainerRef.current) {
          const cardWidth = 320; // w-80 = 320px
          const gap = 24; // gap-6 = 24px
          const scrollPosition = nextIndex * (cardWidth + gap);
          scrollContainerRef.current.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          });
        }
        
        return nextIndex;
      });
    }, 2500); // Faster auto-scroll every 2.5 seconds

    return () => clearInterval(interval);
  }, []);


  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg relative overflow-hidden">
      {/* Grid Lines Background - Matching Hero */}
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
        {/* Section Header - Matching Hero Style */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border border-skyneu-blue/20 dark:border-skyneu-blue/30 text-skyneu-blue dark:text-skyneu-blue rounded-full text-sm font-semibold mb-8 shadow-sm">
            <Star className="h-4 w-4" />
            <span>Trusted by Travelers Worldwide</span>
            <div className="w-2 h-2 bg-skyneu-green rounded-full animate-pulse"></div>
          </div>
          <h2 className="font-bold text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text leading-tight mb-6">
            What Our Users Say
          </h2>
          <p className="text-xl text-skyneu-text dark:text-dark-text-secondary max-w-3xl mx-auto leading-relaxed">
            Discover why travelers choose Skyneu for their journey planning needs
          </p>
        </div>

        {/* Auto-scrolling Container - Clean Cards */}
        <div className="relative overflow-hidden">
          {/* Scroll Container */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide"
            style={{
              scrollBehavior: 'smooth',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex-shrink-0 w-80 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/60 dark:border-dark-border transition-all duration-300 ease-out"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Review Text - Clean Style */}
                <blockquote className="text-skyneu-dark dark:text-dark-text leading-relaxed mb-6 text-base font-medium">
                  "{review.content}"
                </blockquote>

                {/* User Info - Clean Layout */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-skyneu-blue to-skyneu-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {review.avatar ? (
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-skyneu-dark dark:text-dark-text">
                      {review.name}
                    </h4>
                    {review.role && review.company && (
                      <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">
                        {review.role} at {review.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserReviewCarousel;
