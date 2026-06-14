import React from 'react';
import { Shield, Eye, Lock, Database, User, Globe } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 rounded-2xl mb-8">
              <Shield className="h-6 w-6 text-skyneu-blue" />
              <span className="font-semibold text-skyneu-blue">Privacy Policy</span>
            </div>
            <h1 className="font-bold text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-6">
              Your Privacy Matters
            </h1>
            <p className="text-xl text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
              We are committed to protecting your personal information and being transparent about how we collect, use, and share it.
            </p>
            <p className="text-sm text-skyneu-text dark:text-dark-text-secondary mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12">
            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Database className="h-6 w-6 text-skyneu-blue" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Information We Collect</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Personal Information</h3>
                    <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                      <li>• Name and email address when you create an account</li>
                      <li>• Travel preferences and booking history</li>
                      <li>• Payment information (processed securely through third-party providers)</li>
                      <li>• Profile information you choose to share</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Usage Information</h3>
                    <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                      <li>• How you interact with our platform</li>
                      <li>• Search queries and travel interests</li>
                      <li>• Device information and IP address</li>
                      <li>• Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-6 w-6 text-skyneu-green" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">How We Use Your Information</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Service Delivery</h3>
                    <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary text-sm">
                      <li>• Provide AI-powered travel recommendations</li>
                      <li>• Process bookings and reservations</li>
                      <li>• Send important service updates</li>
                      <li>• Provide customer support</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Personalization</h3>
                    <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary text-sm">
                      <li>• Customize travel suggestions</li>
                      <li>• Improve user experience</li>
                      <li>• Remember your preferences</li>
                      <li>• Show relevant content</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-6 w-6 text-purple-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Data Protection</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <div className="space-y-4">
                  <p className="text-skyneu-text dark:text-dark-text-secondary">
                    We implement industry-standard security measures to protect your personal information:
                  </p>
                  <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                    <li>• <strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                    <li>• <strong>Access Controls:</strong> Limited access to authorized personnel only</li>
                    <li>• <strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                    <li>• <strong>Secure Infrastructure:</strong> Cloud-based security with enterprise-grade protection</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6 text-orange-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Your Rights</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Access & Control</h3>
                    <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary text-sm">
                      <li>• View and download your data</li>
                      <li>• Update or correct information</li>
                      <li>• Delete your account and data</li>
                      <li>• Opt-out of marketing communications</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Data Portability</h3>
                    <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary text-sm">
                      <li>• Export your travel data</li>
                      <li>• Transfer data to other services</li>
                      <li>• Request data in machine-readable format</li>
                      <li>• Withdraw consent at any time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Globe className="h-6 w-6 text-blue-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Third-Party Services</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <p className="text-skyneu-text dark:text-dark-text-secondary mb-4">
                  We work with trusted third-party services to provide our platform:
                </p>
                <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                  <li>• <strong>Payment Processors:</strong> Secure payment processing services</li>
                  <li>• <strong>Analytics:</strong> Usage insights and platform optimization (anonymized data)</li>
                  <li>• <strong>Cloud Services:</strong> Secure data storage and hosting infrastructure</li>
                  <li>• <strong>Travel APIs:</strong> Airlines, hotels, and booking platforms for real-time travel data</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-r from-skyneu-blue/5 to-skyneu-green/5 rounded-2xl p-8 border border-skyneu-blue/10">
              <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">Questions About Privacy?</h2>
              <p className="text-skyneu-text dark:text-dark-text-secondary mb-6">
                If you have any questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <div className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                <p><strong>Email:</strong> contact@skyneu.com</p>
                <p><strong>Response Time:</strong> We'll respond within 48 hours</p>
              </div>
            </section>

            {/* Important Notice */}
            <section>
              <div className="bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-2xl p-6 border border-skyneu-blue/20">
                <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Important Notice:</h3>
                <p className="text-skyneu-text dark:text-dark-text-secondary">
                  SkyNeu does not currently process or handle any flight or travel bookings. All payments made on the platform are solely for subscription access to SkyNeu's AI-powered travel tools and features.
                </p>
                <p className="text-skyneu-text dark:text-dark-text-secondary mt-3">
                  Flight booking functionality is planned for future releases, and this policy will be updated before such services become available.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
