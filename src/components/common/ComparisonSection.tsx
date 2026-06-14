import React from 'react';
import { Check, X, Star, Zap, Globe, Brain, Users, Award, Target, BarChart3, FileText, MapPin } from 'lucide-react';

interface Feature {
  name: string;
  skyneu: boolean | string;
  competitors: boolean | string;
  description?: string;
  icon?: React.ReactNode;
}

const features: Feature[] = [
  {
    name: "AI-Powered Personalization",
    skyneu: "Advanced",
    competitors: "Basic",
    description: "Learns your preferences, travel style, and creates truly personalized recommendations",
    icon: <Target className="h-5 w-5" />
  },
  {
    name: "Real-Time AI Results",
    skyneu: true,
    competitors: false,
    description: "Instant AI-powered insights, risk assessments, and dynamic recommendations",
    icon: <Zap className="h-5 w-5" />
  },
  {
    name: "Aviation Education & Learning",
    skyneu: true,
    competitors: false,
    description: "Interactive guides, quizzes, and comprehensive aviation knowledge base",
    icon: <Award className="h-5 w-5" />
  },
  {
    name: "Smart Visa Intelligence",
    skyneu: "AI-Powered",
    competitors: "Static Info",
    description: "Dynamic document checklists, risk assessment, and personalized visa strategies",
    icon: <FileText className="h-5 w-5" />
  },
  {
    name: "Global Coverage",
    skyneu: "200+ Countries",
    competitors: "50+ Countries",
    description: "Comprehensive coverage of airports, airlines, and routes worldwide",
    icon: <Globe className="h-5 w-5" />
  },
  {
    name: "Community & Collaboration",
    skyneu: true,
    competitors: false,
    description: "Share flights, collaborate on trips, and connect with fellow travelers",
    icon: <Users className="h-5 w-5" />
  },
  {
    name: "Advanced Flight Analytics",
    skyneu: true,
    competitors: false,
    description: "Detailed aircraft information, route analysis, and flight performance insights",
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    name: "Context-Aware Intelligence",
    skyneu: true,
    competitors: false,
    description: "Location-based recommendations, embassy-specific info, and cultural insights",
    icon: <MapPin className="h-5 w-5" />
  }
];

const ComparisonSection: React.FC = () => {
  const renderFeatureValue = (value: boolean | string, isSkyneu: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex items-center justify-center">
          <Check className="h-6 w-6 text-green-500" />
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <X className="h-6 w-6 text-red-500" />
        </div>
      );
    }

    return (
      <div className={`text-center font-medium ${isSkyneu ? 'text-skyneu-blue dark:text-skyneu-blue' : 'text-skyneu-text dark:text-dark-text-secondary'}`}>
        {value}
      </div>
    );
  };

  return (
    <section className="py-20 bg-gradient-to-br from-white via-skyneu-light/20 to-skyneu-blue/5 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-skyneu-green/10 dark:bg-skyneu-green/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-skyneu-blue/10 dark:bg-skyneu-blue/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border border-skyneu-green/20 dark:border-skyneu-green/30 text-skyneu-green dark:text-skyneu-green rounded-full text-sm font-semibold mb-6 shadow-sm">
            <Star className="h-4 w-4" />
            <span>Why Choose Skyneu</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-skyneu-dark dark:text-dark-text mb-6">
            Skyneu vs. The Competition
          </h2>
          <p className="text-xl text-skyneu-text dark:text-dark-text-secondary max-w-3xl mx-auto">
            See how Skyneu's innovative features and comprehensive approach set us apart from traditional travel platforms
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 dark:border-dark-border overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 p-4 border-b border-gray-200 dark:border-dark-border">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <h3 className="text-base font-semibold text-skyneu-dark dark:text-dark-text">
                    Features
                  </h3>
                </div>
                <div className="text-center bg-gradient-to-r from-skyneu-blue to-skyneu-green bg-clip-text text-transparent">
                  <h3 className="text-lg font-bold">Skyneu</h3>
                  <p className="text-xs text-skyneu-text dark:text-dark-text-secondary mt-1">
                    The Future of Travel
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-skyneu-text dark:text-dark-text-secondary">
                    Others
                  </h3>
                  <p className="text-xs text-skyneu-text dark:text-dark-text-secondary mt-1">
                    Traditional
                  </p>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-dark-border">
              {features.map((feature, index) => (
                <div key={index} className="p-4 hover:bg-gray-50/50 dark:hover:bg-dark-surface/50 transition-colors">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Feature Name */}
                    <div className="flex items-center gap-2">
                      <div className="text-skyneu-blue dark:text-skyneu-blue flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-skyneu-dark dark:text-dark-text truncate">
                          {feature.name}
                        </h4>
                        {feature.description && (
                          <p className="text-xs text-skyneu-text dark:text-dark-text-secondary mt-1 line-clamp-2">
                            {feature.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Skyneu Value */}
                    <div className="flex justify-center">
                      {renderFeatureValue(feature.skyneu, true)}
                    </div>

                    {/* Competitors Value */}
                    <div className="flex justify-center">
                      {renderFeatureValue(feature.competitors)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unique Value Propositions */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm rounded-xl border border-white/60 dark:border-dark-border">
              <div className="w-12 h-12 bg-gradient-to-br from-skyneu-blue to-skyneu-blue/80 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-skyneu-dark dark:text-dark-text mb-2">
                AI-First Approach
              </h3>
              <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">
                Built with AI at its core, providing intelligent recommendations and personalized experiences.
              </p>
            </div>

            <div className="text-center p-4 bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm rounded-xl border border-white/60 dark:border-dark-border">
              <div className="w-12 h-12 bg-gradient-to-br from-skyneu-green to-skyneu-green/80 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-skyneu-dark dark:text-dark-text mb-2">
                Comprehensive Coverage
              </h3>
              <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">
                From flight tracking to aviation education, we cover every aspect of travel with unmatched depth.
              </p>
            </div>

            <div className="text-center p-4 bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm rounded-xl border border-white/60 dark:border-dark-border">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-skyneu-dark dark:text-dark-text mb-2">
                Community Driven
              </h3>
              <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">
                Connect with fellow travelers and learn from a vibrant community of aviation enthusiasts.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="relative bg-gradient-to-br from-white via-skyneu-light/30 to-white dark:from-dark-surface dark:via-dark-bg dark:to-dark-surface rounded-3xl p-10 lg:p-14 border-2 border-skyneu-blue/30 dark:border-skyneu-blue/40 shadow-2xl overflow-hidden">
              {/* Background Gradient Accent */}
              <div className="absolute inset-0 bg-gradient-to-r from-skyneu-blue/5 via-skyneu-green/5 to-skyneu-blue/5 dark:from-skyneu-blue/10 dark:via-skyneu-green/10 dark:to-skyneu-blue/10 rounded-3xl"></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Title */}
                <h3 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-skyneu-blue via-skyneu-green to-skyneu-blue bg-clip-text text-transparent mb-4 leading-tight">
                  Support the future of AI-powered travel
                </h3>
                
                {/* Subtitle */}
                <div className="max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 rounded-full border border-skyneu-blue/20 dark:border-skyneu-blue/30 mb-8">
                    <span className="text-2xl font-bold text-skyneu-blue dark:text-skyneu-green">$2.99/month</span>
                    <span className="text-gray-600 dark:text-gray-400">•</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Early Access Price</span>
                  </div>
                  
                  {/* Benefits Grid */}
                  <div className="grid md:grid-cols-2 gap-4 text-left mb-10">
                    <div className="flex items-start gap-3 p-4 bg-white/80 dark:bg-dark-surface/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-skyneu-blue/40 dark:hover:border-skyneu-blue/40 transition-all duration-300 hover:shadow-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Build smarter flight insights for travelers like you
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-white/80 dark:bg-dark-surface/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-skyneu-blue/40 dark:hover:border-skyneu-blue/40 transition-all duration-300 hover:shadow-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Deliver real-time updates that keep trips stress-free
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-white/80 dark:bg-dark-surface/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-skyneu-blue/40 dark:hover:border-skyneu-blue/40 transition-all duration-300 hover:shadow-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Improve the platform so it works flawlessly for everyone
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-white/80 dark:bg-dark-surface/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-skyneu-blue/40 dark:hover:border-skyneu-blue/40 transition-all duration-300 hover:shadow-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                        Launch new features faster — powered by your support
                      </span>
                    </div>
                  </div>
                  
                  {/* Closing Statement */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-skyneu-blue/5 via-skyneu-green/5 to-skyneu-blue/5 dark:from-skyneu-blue/10 dark:via-skyneu-green/10 dark:to-skyneu-blue/10 rounded-2xl blur-xl"></div>
                    <p className="relative text-xl lg:text-2xl font-semibold text-gray-800 dark:text-white py-4">
                      Be part of making travel effortless for everyone.
                    </p>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="group px-10 py-4 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      Start Now
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-skyneu-green to-skyneu-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  <button className="px-10 py-4 bg-white dark:bg-dark-surface border-2 border-skyneu-blue text-skyneu-blue dark:text-skyneu-green font-bold text-lg rounded-2xl hover:bg-skyneu-blue hover:text-white dark:hover:bg-skyneu-blue dark:hover:text-white hover:shadow-xl hover:scale-105 transition-all duration-300">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
