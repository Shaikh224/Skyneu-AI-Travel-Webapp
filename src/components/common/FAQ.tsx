import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "What makes SkyNeu different from other travel apps?",
    answer: "SkyNeu isn't just another flight search tool — it's an AI-native travel copilot. It learns your preferences, analyzes real-time data, and crafts personalized itineraries that balance price, comfort, and convenience. You get smarter options, not endless lists."
  },
  {
    id: 2,
    question: "How does SkyNeu's AI-powered flight search work?",
    answer: "Our AI scans thousands of routes, airlines, and booking platforms in seconds. It considers factors like prices, layovers, weather, and disruptions to surface the best possible flight combinations — often revealing smarter routes traditional search engines miss."
  },
  {
    id: 3,
    question: "How accurate is SkyNeu's flight tracking and updates?",
    answer: "SkyNeu uses live aviation data from multiple global sources, ensuring 99.9% accuracy. You'll receive instant updates on delays, gate changes, and disruptions — so you can plan ahead with confidence."
  },
  {
    id: 4,
    question: "Can I use SkyNeu for group or business travel?",
    answer: "Yes. SkyNeu supports both personal and professional travel planning. Organizers can manage itineraries, budgets, and updates in one place, while collaborators get view-only access to shared trips and expenses — ideal for teams and families."
  },
  {
    id: 5,
    question: "Does SkyNeu work internationally?",
    answer: "Absolutely. SkyNeu covers 190+ countries and thousands of airports worldwide, providing visa information, travel advisories, and destination insights — making it your all-in-one global travel assistant."
  },
  {
    id: 6,
    question: "Why does SkyNeu offer only paid plans (no free trial)?",
    answer: "SkyNeu uses advanced AI systems and premium data sources that require continuous processing and maintenance. A paid model allows us to keep results accurate, scale efficiently, and offer dedicated user support for every traveler. This ensures a reliable, high-quality experience backed by real humans who can help whenever you need."
  },
];

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

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
            <HelpCircle className="h-4 w-4" />
            <span>Frequently Asked Questions</span>
            <div className="w-2 h-2 bg-skyneu-green rounded-full animate-pulse"></div>
          </div>
          <h2 className="font-bold text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text leading-tight mb-6">
            Got Questions?
          </h2>
          <p className="text-xl text-skyneu-text dark:text-dark-text-secondary max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about Skyneu's features and services
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqData.map((item) => (
              <div
                key={item.id}
                className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-dark-border shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-white/90 dark:hover:bg-dark-surface/90 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-skyneu-dark dark:text-dark-text pr-4">
                    {item.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openItems.includes(item.id) ? (
                      <ChevronUp className="h-5 w-5 text-skyneu-blue" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-skyneu-blue" />
                    )}
                  </div>
                </button>
                
                {openItems.includes(item.id) && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-200 dark:border-dark-border pt-4">
                      <p className="text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-skyneu-text dark:text-dark-text-secondary mb-4">
            Still have questions?
          </p>
          <button 
            onClick={() => {
              const footer = document.querySelector('footer');
              if (footer) {
                footer.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-blue/90 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <HelpCircle className="h-4 w-4" />
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
