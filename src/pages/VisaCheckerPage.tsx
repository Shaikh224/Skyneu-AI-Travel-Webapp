import React from 'react';
import Header from '@/components/layout/Header';
import VisaChecker from '@/components/common/VisaChecker';
import { Shield, Brain, Sparkles, Globe, FileText, Clock } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

const VisaCheckerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      <SEOHead
        title="Visa Checker - Instant Visa Requirements Powered by AI | SkyNeu"
        description="Check visa requirements instantly with SkyNeu's AI-powered visa checker. Real-time updates, document guidance, and personalized recommendations."
        canonical="https://skyneu.com/visa-checker"
        keywords="visa checker, visa requirements, travel visa, visa rules, immigration, skyneu"
      />
      <Header />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-skyneu-blue/20">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">AI-POWERED VISA INTELLIGENCE</span>
              <span className="sm:hidden">AI VISA CHECKER</span>
              <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <h1 className="font-bold text-2xl sm:text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4 bg-gradient-to-r from-skyneu-dark dark:from-dark-text to-skyneu-blue bg-clip-text text-transparent">
              Smart Visa Requirements Checker
            </h1>
            <p className="text-skyneu-text dark:text-dark-text-secondary max-w-2xl mx-auto text-sm sm:text-lg px-4">
              Get instant, AI-powered visa requirements with real-time updates, document scanning, and personalized application guidance.
            </p>
          </div>

          {/* Main Visa Checker */}
          <div className="max-w-7xl mx-auto">
            <VisaChecker />
          </div>
        </div>
      </main>
    </div>
  );
};

export default VisaCheckerPage;