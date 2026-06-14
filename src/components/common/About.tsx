import React from 'react';
import { Shield, Target, Sparkles, TrendingUp, Heart, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
  const { isAuthenticated, needsOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/onboarding');
    } else {
      navigate('/profile');
    }
  };

  const values = [
    {
      icon: <Target className="h-8 w-8 text-skyneu-blue" />,
      title: "Our Mission",
      description: "To revolutionize travel planning through AI-driven personalization, making every journey seamless and memorable.",
      gradient: "from-skyneu-blue/10 to-skyneu-blue/5 dark:from-skyneu-blue/20 dark:to-dark-surface"
    },
    {
      icon: <Shield className="h-8 w-8 text-skyneu-green" />,
      title: "Our Promise",
      description: "Delivering secure, reliable, and intelligent travel solutions that adapt to your unique preferences and needs.",
      gradient: "from-skyneu-green/10 to-skyneu-green/5 dark:from-skyneu-green/20 dark:to-dark-surface"
    },
    {
      icon: <Sparkles className="h-8 w-8 text-purple-500" />,
      title: "Our Innovation",
      description: "Continuously evolving our AI technology to provide smarter, more intuitive travel experiences for our users.",
      gradient: "from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-dark-surface"
    }
  ];

  const features = [
    "AI-powered personalization",
    "Real-time price monitoring",
    "Smart itinerary optimization",
    "24/7 intelligent support",
    "Secure data protection",
    "Global travel coverage"
  ];

  return (
    <section id="about" className="py-24 bg-white dark:bg-dark-bg scroll-mt-20 transition-colors duration-300">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue rounded-full text-sm font-semibold mb-8 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
            <Sparkles className="h-4 w-4" />
            <span>ABOUT SKYNEU</span>
          </div>
          <h2 className="font-bold text-4xl lg:text-6xl text-skyneu-dark dark:text-dark-text mb-8 leading-tight">
            Transforming Travel with
            <span className="block text-transparent bg-gradient-to-r from-skyneu-blue to-skyneu-green bg-clip-text">
              Artificial Intelligence
            </span>
          </h2>
          <p className="text-xl text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
            At SkyNeu, we're reimagining how people plan trips — using the power of today's most advanced AI systems, not reinventing them. Our platform combines trusted AI models, real travel data, and thoughtful design to make planning easier, faster, and more personal.
          </p>
        </div>


        {/* Values Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
          {values.map((value, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-br ${value.gradient} rounded-3xl p-8 group hover:shadow-lg transition-all duration-500 border border-white/50 dark:border-dark-border`}
            >
              <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {value.icon}
              </div>
              <h3 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">
                {value.title}
              </h3>
              <p className="text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          <div className="flex flex-col">
            <div className="mb-8">
              <h3 className="font-bold text-3xl text-skyneu-dark dark:text-dark-text mb-6">
                The Future of Travel Planning
              </h3>
              <p className="text-lg text-skyneu-text dark:text-dark-text-secondary mb-6 leading-relaxed">
                At SkyNeu, we’re reimagining how people plan trips — using the power of today’s most advanced AI systems, not reinventing them. Our platform combines trusted AI models, real travel data, and thoughtful design to make planning easier, faster, and more personal.
              </p>
              <p className="text-lg text-skyneu-text dark:text-dark-text-secondary mb-6 leading-relaxed">
                We analyze millions of data points from flights, destinations, and traveler behavior to give you relevant insights and smart recommendations — without the noise or guesswork.
              </p>
              <p className="text-lg text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
                SkyNeu isn't about replacing human decision-making; it's about simplifying it. We focus on clarity, transparency, and usefulness — so every itinerary, alert, or suggestion feels tailored to you, not generated at random.
              </p>
            </div>

            {/* Features List */}
            <div className="bg-gradient-to-br from-skyneu-light/30 dark:from-dark-border/30 to-white dark:to-dark-surface rounded-3xl p-8 border border-gray-100 dark:border-dark-border flex-1">
              <h4 className="font-bold text-xl text-skyneu-dark dark:text-dark-text mb-6">What Makes Us Different</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-skyneu-green flex-shrink-0" />
                    <span className="text-skyneu-text dark:text-dark-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-8">
              <h3 className="font-bold text-3xl text-skyneu-dark dark:text-dark-text mb-6">
                Our Commitment to Innovation
              </h3>
              <p className="text-lg text-skyneu-text dark:text-dark-text-secondary mb-6 leading-relaxed">
                At SkyNeu, innovation means solving real traveler problems — not just adding features for the sake of it. We work with experienced developers, designers, and travel enthusiasts who share one goal: making travel planning genuinely easier and more human.
              </p>
              <p className="text-lg text-skyneu-text dark:text-dark-text-secondary mb-6 leading-relaxed">
                Every update we release — from real-time flight tracking to smarter itinerary suggestions — is shaped by user feedback and real-world travel challenges. We focus on what truly helps: less time spent searching, fewer surprises, and more clarity when you need it most.
              </p>
              <p className="text-lg text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
                SkyNeu is built on a simple promise — to keep improving, keep listening, and keep making travel smarter, faster, and more intuitive for everyone.
              </p>
            </div>

            {/* Innovation Metrics */}
            <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border p-8 flex-1">
              <h4 className="font-bold text-xl text-skyneu-dark dark:text-dark-text mb-6">Innovation Metrics</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-skyneu-text dark:text-dark-text-secondary">AI Accuracy</span>
                    <span className="font-bold text-skyneu-blue">98.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                    <div className="bg-gradient-to-r from-skyneu-blue to-skyneu-green h-2 rounded-full" style={{ width: '98.5%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-skyneu-text dark:text-dark-text-secondary">User Satisfaction</span>
                    <span className="font-bold text-skyneu-green">97.8%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                    <div className="bg-gradient-to-r from-skyneu-green to-skyneu-blue h-2 rounded-full" style={{ width: '97.8%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-skyneu-text dark:text-dark-text-secondary">Platform Reliability</span>
                    <span className="font-bold text-purple-500">99.9%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-3xl p-12 text-center text-white">
          <h3 className="font-bold text-3xl mb-6">Ready to Experience the Future?</h3>
          <p className="text-xl mb-8 opacity-90">Join thousands of travelers who have already discovered smarter travel planning.</p>
          <button 
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-skyneu-blue font-semibold rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            {isAuthenticated ? 'Continue' : 'Start Your Journey Today'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default About;