import React from 'react';
import { Brain, Search, CheckSquare, Zap, Plane } from 'lucide-react';

const Features: React.FC = () => {
  const mainFeatures = [
    {
      icon: <Brain className="h-12 w-12 text-skyneu-blue" />,
      title: "AI Travel Assistant",
      description: "Your personal travel expert that learns your preferences and builds custom trip itineraries tailored to your style.",
      gradient: "from-skyneu-blue/10 to-skyneu-blue/5 dark:from-skyneu-blue/20 dark:to-dark-surface",
      borderColor: "border-skyneu-blue/20 dark:border-skyneu-blue/30"
    },
    {
      icon: <Search className="h-12 w-12 text-skyneu-green" />,
      title: "Smart Search Engine",
      description: "Find the best flights and hotels with our intelligent search that understands your needs and budget constraints.",
      gradient: "from-skyneu-green/10 to-skyneu-green/5 dark:from-skyneu-green/20 dark:to-dark-surface",
      borderColor: "border-skyneu-green/20 dark:border-skyneu-green/30"
    },
    {
      icon: <CheckSquare className="h-12 w-12 text-orange-500" />,
      title: "Smart Travel Tools",
      description: "Auto-generated checklists, expense trackers, and itinerary builders that adapt to your trip requirements.",
      gradient: "from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-dark-surface",
      borderColor: "border-orange-200 dark:border-orange-700/50"
    },
    {
      icon: <Plane className="h-12 w-12 text-purple-500" />,
      title: "Flight Tracking & Alerts",
      description: "Real-time flight monitoring with instant notifications for delays, gate changes, and weather updates.",
      gradient: "from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-dark-surface",
      borderColor: "border-purple-200 dark:border-purple-700/50"
    }
  ];


  return (
    <section id="features" className="py-24 bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg transition-colors duration-300">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-sm font-semibold mb-8 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
            <Zap className="h-4 w-4" />
            <span>AI-POWERED FEATURES</span>
          </div>
          <h2 className="font-bold text-4xl lg:text-6xl text-skyneu-dark dark:text-dark-text mb-8 leading-tight">
            Travel Smarter,
            <span className="block text-transparent bg-gradient-to-r from-skyneu-blue to-skyneu-green bg-clip-text">
              Not Harder
            </span>
          </h2>
          <p className="text-xl text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
            Our advanced AI technology makes planning your trips effortless, 
            giving you more time to enjoy your travels and create lasting memories.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-20">
          {mainFeatures.map((feature, index) => (
            <div 
              key={index} 
              className={`bg-gradient-to-br ${feature.gradient} rounded-3xl p-8 group hover:shadow-xl transition-all duration-500 border ${feature.borderColor}`}
            >
              <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">
                {feature.title}
              </h3>
              <p className="text-lg text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-6 h-1 w-16 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full transform origin-left group-hover:scale-x-150 transition-transform duration-500"></div>
            </div>
          ))}
        </div>


      </div>
    </section>
  );
};

export default Features;