import React from 'react';
import { Plane, Brain, Users, Search, Zap, Globe, Bell } from 'lucide-react';

const ComingSoon: React.FC = () => {
  const features = [
    {
      icon: <Plane className="h-12 w-12 text-skyneu-blue" />,
      title: "Advanced Flight Tracker",
      description: "Real-time updates on flights, gates, and disruptions with AI predictions"
    },
    {
      icon: <Brain className="h-12 w-12 text-skyneu-green" />,
      title: "AI Travel Assistant",
      description: "Personalized recommendations and intelligent trip planning"
    },
    {
      icon: <Search className="h-12 w-12 text-purple-500" />,
      title: "Smart Search Engine",
      description: "AI-powered flight and hotel search with price predictions"
    },
    {
      icon: <Users className="h-12 w-12 text-orange-500" />,
      title: "Group Planning Tools",
      description: "Collaborative trip planning with smart budgeting"
    },
    {
      icon: <Globe className="h-12 w-12 text-blue-500" />,
      title: "Global Travel Hub",
      description: "Interactive aviation education and travel insights"
    },
    {
      icon: <Bell className="h-12 w-12 text-green-500" />,
      title: "Smart Notifications",
      description: "Personalized alerts and travel updates"
    }
  ];


  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg transition-colors duration-300">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-green/10 to-skyneu-blue/10 text-skyneu-green rounded-full text-sm font-semibold mb-8 border border-skyneu-green/20 dark:border-skyneu-green/30">
            <Zap className="h-4 w-4" />
            <span>FEATURES</span>
          </div>
          <h2 className="font-bold text-4xl lg:text-6xl text-skyneu-dark dark:text-dark-text mb-8 leading-tight">
            Powerful Features
            <span className="block text-transparent bg-gradient-to-r from-skyneu-blue to-skyneu-green bg-clip-text">
              For Modern Travel
            </span>
          </h2>
          <p className="text-xl text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
            Discover the comprehensive suite of tools designed to enhance your travel planning experience.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-dark-surface rounded-3xl p-8 transform hover:-translate-y-2 transition-all duration-500 group border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-lg"
            >
              <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">
                {feature.title}
              </h3>
              <p className="text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ComingSoon;