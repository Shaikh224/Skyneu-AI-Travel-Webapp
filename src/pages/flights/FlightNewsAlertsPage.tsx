import React from 'react';
import FlightNewsAlerts from '@/components/flights/FlightNewsAlerts';
import { Bell, Brain } from 'lucide-react';

const FlightNewsAlertsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-skyneu-light/10 to-skyneu-blue/5 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg transition-colors duration-300">
      <main className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">SMART FLIGHT INTELLIGENCE CENTER</span>
              <span className="sm:hidden">FLIGHT INTELLIGENCE</span>
              <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4 bg-gradient-to-r from-skyneu-dark dark:from-dark-text to-skyneu-blue bg-clip-text text-transparent">
              Flight News & Alerts
            </h1>
            <p className="text-skyneu-text dark:text-dark-text-secondary max-w-2xl mx-auto text-sm sm:text-lg px-4">
              Stay ahead with AI-powered flight alerts, real-time aviation news, and personalized travel intelligence that keeps you informed and prepared.
            </p>
          </div>

          {/* Main Component */}
          <div className="max-w-7xl mx-auto">
            <FlightNewsAlerts />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FlightNewsAlertsPage;