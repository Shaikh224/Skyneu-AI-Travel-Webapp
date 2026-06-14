import React from 'react';
import { ArrowLeft, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      {/* Header */}
      <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-dark-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-skyneu-blue/10 dark:bg-skyneu-blue/20 rounded-full text-skyneu-blue dark:text-skyneu-blue mb-6">
              <Cookie className="h-5 w-5" />
              <span className="font-semibold">Cookie Policy</span>
            </div>
            <h1 className="font-bold text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-6">
              Cookie Policy
            </h1>
            <p className="text-lg text-skyneu-text dark:text-dark-text-secondary max-w-2xl mx-auto">
              Simple and transparent information about how we handle cookies on our platform.
            </p>
          </div>

          {/* Effective Date */}
          <div className="bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-2xl p-6 mb-8">
            <p className="text-sm text-skyneu-text dark:text-dark-text-secondary">
              <strong className="text-skyneu-dark dark:text-dark-text">Effective Date:</strong> {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Policy Content */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 border border-gray-200 dark:border-dark-border shadow-sm">
            <div className="space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">Our Commitment to Your Privacy</h2>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    At SkyNeu, we respect your privacy and are committed to transparency about how we handle your data. 
                    We currently <strong>do not use cookies or similar tracking technologies</strong> to collect, store, or share personal information.
                  </p>
                </div>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">Third-Party Services</h2>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    However, certain third-party services that support our platform (such as hosting providers, analytics tools, or payment processors) 
                    may use their own cookies as part of their standard operations. These cookies are managed under their respective privacy policies, 
                    which we encourage you to review.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <h3 className="font-semibold text-skyneu-dark dark:text-dark-text mb-3">Third-Party Services We May Use:</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Hosting providers for platform infrastructure</li>
                      <li>Analytics tools for service improvement</li>
                      <li>Payment processors for secure transactions</li>
                      <li>Content delivery networks for optimal performance</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Future Changes */}
              <section>
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">Future Updates</h2>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    If our use of cookies changes in the future, this policy will be updated to reflect those changes, and users will be notified 
                    where required by law. We are committed to maintaining transparency with our users regarding any changes to our data practices.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">Questions or Concerns</h2>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    For more information, please refer to our <Link to="/privacy-policy" className="text-skyneu-blue hover:underline">Privacy Policy</Link> or contact us at:
                  </p>
                  <div className="bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-xl p-4">
                    <p><strong className="text-skyneu-dark dark:text-dark-text">Email:</strong> contact@skyneu.com</p>
                    <p><strong className="text-skyneu-dark dark:text-dark-text">Response Time:</strong> Within 24-48 hours</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
            <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Your Rights</h3>
            <p className="text-skyneu-text dark:text-dark-text-secondary">
              You have the right to understand how your data is being used. We are committed to providing clear, accessible information 
              about our data practices and any third-party services we utilize. If you have any questions or concerns, please don't hesitate to reach out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
