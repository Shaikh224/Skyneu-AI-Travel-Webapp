import React from 'react';
import { Plane, Users, Globe, Heart, Zap, Target, TrendingUp } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { organizationSchema, websiteSchema } from '@/config/seoSchemas';

const AboutPage: React.FC = () => {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://skyneu.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "About Us",
        "item": "https://skyneu.com/about"
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="About Us - Building the Future of AI Travel | SkyNeu"
        description="Learn about SkyNeu's mission to make travel planning effortless with AI-powered tools. Discover our story, values, and commitment to helping travelers worldwide."
        canonical="https://skyneu.com/about"
        keywords="about skyneu, travel technology, AI travel platform, company mission, travel innovation"
        schemaData={[organizationSchema, websiteSchema, breadcrumbSchema]}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-skyneu-blue/5 via-skyneu-green/5 to-skyneu-blue/5 dark:from-skyneu-blue/10 dark:via-skyneu-green/10 dark:to-skyneu-blue/10"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 rounded-full border border-skyneu-blue/20 dark:border-skyneu-blue/30 mb-6">
                <Plane className="h-5 w-5 text-skyneu-blue dark:text-skyneu-green" />
                <span className="text-sm font-semibold text-skyneu-blue dark:text-skyneu-green uppercase tracking-wide">About SkyNeu</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-skyneu-blue via-skyneu-green to-skyneu-blue bg-clip-text text-transparent leading-tight">
                Making Travel Effortless for Everyone
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
                We're building the future of travel planning with AI-powered tools that help you discover, plan, and track your journeys with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                    Our Mission
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    At SkyNeu, we believe travel should be exciting, not stressful. Our mission is to empower every traveler with intelligent tools that make planning, booking, and tracking trips as simple as possible.
                  </p>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    We're combining cutting-edge AI technology with real-time data to deliver insights that help you make smarter travel decisions—whether you're a frequent flyer or planning your first big adventure.
                  </p>
                </div>
                
                <div className="relative">
                  <div className="bg-gradient-to-br from-white to-skyneu-light/30 dark:from-dark-surface dark:to-dark-bg rounded-3xl p-8 border-2 border-skyneu-blue/30 dark:border-skyneu-blue/40 shadow-2xl">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r from-skyneu-blue to-skyneu-green flex items-center justify-center">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Innovation First</h3>
                          <p className="text-gray-600 dark:text-gray-300">Pushing boundaries with AI to solve real travel problems</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r from-skyneu-blue to-skyneu-green flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">User-Centered</h3>
                          <p className="text-gray-600 dark:text-gray-300">Every feature designed with travelers' needs in mind</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r from-skyneu-blue to-skyneu-green flex items-center justify-center">
                          <Heart className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Passion for Travel</h3>
                          <p className="text-gray-600 dark:text-gray-300">Built by travelers who understand the journey</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 lg:py-24 bg-white/50 dark:bg-dark-surface/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                  Our Core Values
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  These principles guide everything we do at SkyNeu
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 border border-gray-200 dark:border-gray-700/50 hover:border-skyneu-blue/40 dark:hover:border-skyneu-blue/40 transition-all hover:shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mb-4 mx-auto">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">Speed & Efficiency</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    Get instant insights and real-time updates. We believe your time is valuable and act accordingly.
                  </p>
                </div>

                <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 border border-gray-200 dark:border-gray-700/50 hover:border-skyneu-blue/40 dark:hover:border-skyneu-blue/40 transition-all hover:shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                    <Globe className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">Global Reach</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    Supporting travelers worldwide with comprehensive coverage and multilingual capabilities.
                  </p>
                </div>

                <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 border border-gray-200 dark:border-gray-700/50 hover:border-skyneu-blue/40 dark:hover:border-skyneu-blue/40 transition-all hover:shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mb-4 mx-auto">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">Continuous Growth</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    Always improving, always learning. We iterate based on your feedback to serve you better.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About SkyNeu Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-dark-surface rounded-3xl p-8 lg:p-12 border-2 border-skyneu-blue/30 dark:border-skyneu-blue/40 shadow-xl">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                  What is SkyNeu?
                </h2>
                
                <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p>
                    <strong className="text-gray-900 dark:text-white">SkyNeu is an AI-powered travel platform</strong> designed to simplify every aspect of your journey. Whether you're planning your next trip, tracking flights in real-time, or checking visa requirements, we provide intelligent tools that make travel planning effortless.
                  </p>
                  
                  <p>
                    Our platform combines <strong className="text-gray-900 dark:text-white">cutting-edge artificial intelligence</strong> with comprehensive travel data to deliver personalized recommendations, real-time updates, and smart insights that help you make informed decisions.
                  </p>
                  
                  <p>
                    From <strong className="text-gray-900 dark:text-white">AI-powered trip planning</strong> that creates customized itineraries to <strong className="text-gray-900 dark:text-white">real-time flight tracking</strong> that keeps you updated on delays and gate changes, SkyNeu is your complete travel companion.
                  </p>
                  
                  <p>
                    We're currently in <strong className="text-gray-900 dark:text-white">early access</strong>, constantly improving based on feedback from our community of travelers. For just $2.99/month, you can join us in shaping the future of travel technology while enjoying full access to all our premium features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-skyneu-blue/5 via-skyneu-green/5 to-skyneu-blue/5 dark:from-skyneu-blue/10 dark:via-skyneu-green/10 dark:to-skyneu-blue/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Join Us on This Journey
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                For just $2.99/month, support the future of AI-powered travel and get access to all our premium features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group px-10 py-4 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started
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
        </section>
      </div>
    </>
  );
};

export default AboutPage;
